import { IncomingMessage, ServerResponse } from 'http';
import { OtpService, getSupabaseAdmin, REGISTERED_DEMO_FARMERS } from './otpService.ts';
import { handleCmsRoutes } from './cmsRouter.ts';

/**
 * Helper to parse JSON body from incoming Node.js HTTP request
 */
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      // Safeguard max payload size (100KB)
      if (body.length > 100 * 1024) {
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Helper to send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

/**
 * Connect/Express compatible HTTP middleware for Vite dev server and Node servers
 */
export async function apiAuthMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  // Developer Portal & CMS Endpoints
  const cmsHandled = await handleCmsRoutes(req, res, sendJson, parseJsonBody);
  if (cmsHandled) {
    return;
  }

  // Route 1: Health check
  if (url === '/api/auth/health' || url.startsWith('/api/auth/health?')) {
    const has2FactorKey = !!process.env.TWOFACTOR_API_KEY;
    const hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasSupabaseUrl = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

    sendJson(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      configured: {
        twoFactor: has2FactorKey,
        supabaseUrl: hasSupabaseUrl,
        supabaseServiceKey: hasSupabaseServiceKey,
      },
    });
    return;
  }

  // Route 2: Send OTP
  if (url === '/api/auth/send-otp' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const result = await OtpService.requestOtp(body.phone, clientIp);

      if (!result.success) {
        const statusCode = result.error === 'NOT_REGISTERED' ? 404 : result.error === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
        sendJson(res, statusCode, result);
        return;
      }

      sendJson(res, 200, result);
      return;
    } catch (err: any) {
      console.error('[API] /api/auth/send-otp exception:', err);
      sendJson(res, 500, {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal server error occurred.',
      });
      return;
    }
  }

  // Route 3: Verify OTP
  if (url === '/api/auth/verify-otp' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await OtpService.verifyOtp(body.sessionId, body.otp, body.phone);

      if (!result.success) {
        const statusCode = result.error === 'MAX_ATTEMPTS_EXCEEDED' ? 429 : result.error === 'OTP_EXPIRED' ? 410 : 400;
        sendJson(res, statusCode, result);
        return;
      }

      sendJson(res, 200, result);
      return;
    } catch (err: any) {
      console.error('[API] /api/auth/verify-otp exception:', err);
      sendJson(res, 500, {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal server error occurred.',
      });
      return;
    }
  }

  // Route 4: Farmer Self-Registration (Name, District, Phone, Language, Crop)
  if (url === '/api/farmer/register' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      if (!body.name || !body.phone || !body.district) {
        sendJson(res, 400, {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Farmer Name, Phone Number, and District are required for registration.',
        });
        return;
      }

      const registered = OtpService.registerFarmer({
        name: body.name.trim(),
        phone: body.phone.trim(),
        district: body.district.trim(),
        taluka: body.taluka?.trim() || '',
        village: body.village?.trim() || '',
        state: body.state || 'Maharashtra',
        primaryCrop: body.primaryCrop || 'Onion',
        preferredLanguage: body.preferredLanguage || 'mr',
        landAreaAcres: Number(body.landAreaAcres) || 2.0,
      });

      sendJson(res, 200, {
        success: true,
        message: 'Farmer registration completed successfully.',
        farmer: registered.farmer,
      });
      return;
    } catch (err: any) {
      console.error('[API] /api/farmer/register exception:', err);
      sendJson(res, 500, {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to register farmer.',
      });
      return;
    }
  }

  // Route 5: Telephony DTMF Keypad Response Recording
  if (url === '/api/telephony/record-dtmf' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { farmerId, advisoryId, key } = body;

      if (!farmerId || !key) {
        sendJson(res, 400, {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Farmer ID and DTMF Key (1, 2, or 3) are required.',
        });
        return;
      }

      const decision = key === '1' ? 'SELL_NOW' : key === '2' ? 'STORE' : 'CALL_AGAIN';
      const cooldownDays = key === '3' ? 3 : 7;
      const cooldownUntil = new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000).toISOString();

      sendJson(res, 200, {
        success: true,
        farmerId,
        advisoryId,
        key,
        decision,
        cooldownDays,
        cooldownUntil,
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (err: any) {
      console.error('[API] /api/telephony/record-dtmf exception:', err);
      sendJson(res, 500, {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Failed to record DTMF key.',
      });
      return;
    }
  }

  // Route 5.1: Telephony Gateway Status Check
  if (url === '/api/telephony/status' && req.method === 'GET') {
    const hasTwilioSid = !!process.env.TWILIO_ACCOUNT_SID;
    const hasTwilioToken = !!process.env.TWILIO_AUTH_TOKEN;
    const hasTwilioPhone = !!process.env.TWILIO_PHONE_NUMBER;
    const twilioConfigured = hasTwilioSid && hasTwilioToken && hasTwilioPhone;

    sendJson(res, 200, {
      success: true,
      twilioConfigured,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ? `${process.env.TWILIO_PHONE_NUMBER.slice(0, 4)}...${process.env.TWILIO_PHONE_NUMBER.slice(-4)}` : null,
      maxBatchSize: 50,
      cooldownMinutes: 15,
      rateLimitDelayMs: 750,
      note: twilioConfigured
        ? 'Twilio Programmable Voice Gateway ready.'
        : 'Twilio telephony credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.',
    });
    return;
  }

  // Route 5.15: Get All Registered Farmers for Bulk Calling
  if (url === '/api/telephony/farmers' && req.method === 'GET') {
    try {
      const supabase = getSupabaseAdmin();
      let farmers: any[] = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('farmers').select('*').order('name', { ascending: true });
          if (data && data.length > 0) {
            farmers = data.map((d: any) => ({
              id: d.farmer_id || d.id,
              name: d.name,
              phone: d.phone,
              state: d.state || 'Andhra Pradesh',
              district: d.district || '',
              taluka: d.taluka || '',
              village: d.village || '',
              primaryCrop: d.primary_crop || 'Onion',
              landAreaAcres: Number(d.land_area_acres) || 0,
              expectedHarvestQuintals: Number(d.expected_harvest_quintals) || 0,
              preferredLanguage: d.preferred_language || 'te',
              consentForAdvisory: true,
              registeredDate: d.registration_date || d.created_at || '2026-09-21',
              status: 'Active',
            }));
          }
        } catch {}
      }

      // Merge with REGISTERED_DEMO_FARMERS
      const existingIds = new Set(farmers.map((f) => f.id));
      const missingDemo = REGISTERED_DEMO_FARMERS.filter((d) => !existingIds.has(d.id || d.farmer_id)).map((d) => ({
        id: d.id || d.farmer_id,
        name: d.name,
        phone: d.phone,
        state: d.state || 'Andhra Pradesh',
        district: d.district || 'Krishna',
        taluka: d.taluka || 'Vijayawada',
        village: d.village || 'IBM',
        primaryCrop: d.primaryCrop || d.primary_crop || 'Onion',
        landAreaAcres: Number(d.landAreaAcres || d.land_area_acres) || 100,
        expectedHarvestQuintals: Number(d.expectedHarvestQuintals) || 400,
        preferredLanguage: d.preferredLanguage || d.preferred_language || 'te',
        consentForAdvisory: true,
        registeredDate: '2026-09-21',
        status: 'Active',
      }));

      const allFarmers = [...farmers, ...missingDemo];
      sendJson(res, 200, { success: true, farmers: allFarmers });
      return;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return;
    }
  }

  // Route 5.16: TwiML Voice Welcome Response (Telugu Advisory Greeting)
  if (
    (url.startsWith('/api/telephony/twiml/welcome') ||
     url.startsWith('/api/telephony/twiml') ||
     url.startsWith('/api/voice/welcome')) &&
    (req.method === 'GET' || req.method === 'POST')
  ) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="1"/>
    <Say voice="Google.te-IN-Standard-A" language="te-IN">నమస్కారం గారు! మీరు Farmer's Gamble వ్యవసాయ సహాయక సేవలో నమోదు చేసుకున్నందుకు ధన్యవాదాలు.

ఈ సేవ ద్వారా మీ పంటకు సంబంధించిన ముఖ్యమైన సమాచారం, మార్కెట్ ధరలు, వాతావరణ సమాచారం మరియు అవసరమైన వ్యవసాయ సహాయం గురించి మీకు తెలియజేస్తాము.

మీకు పంటలో ఏవైనా సమస్యలు ఎదురైతే, వాటి గురించి మాతో పంచుకోవచ్చు. అవసరమైతే సంబంధిత వ్యవసాయ అధికారుల సహాయం పొందేందుకు కూడా మేము సహకరిస్తాము.

వచ్చే వారం నుంచి మీకు క్రమం తప్పకుండా కాల్స్ వస్తాయి. మీ పంట పరిస్థితి, సాగు పురోగతి మరియు మీకు అవసరమైన సహాయం గురించి అడుగుతాము.

మీకు ఈ సేవ ఉపయోగకరంగా ఉంటుందని ఆశిస్తున్నాము.

ధన్యవాదాలు గారు. మీ పంట పచ్చగా పండాలని కోరుకుంటున్నాము. నమస్కారం!</Say>
</Response>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.end(twiml);
    return;
  }

  // Route 5.2: Bulk Make Calls (Dev server fallback & local testing handler)
  if (url === '/api/telephony/bulk-make-calls' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const {
        farmerIds,
        callPurpose = 'Routine AI Advisory',
        batchId = `batch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        adminEmail,
      } = body;

      // 1. Authorization check
      const authHeader = req.headers['authorization'] || '';
      const authorizedAdmins = ['admin@hackara.in', 'tao.niphad@krishi.maharashtra.gov.in'];
      const isAuthorized =
        (adminEmail && authorizedAdmins.includes(adminEmail.toLowerCase())) ||
        (authHeader && authHeader.length > 10);

      if (!isAuthorized) {
        sendJson(res, 403, {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Access restricted to authorized administrators and agriculture officers.',
        });
        return;
      }

      // 2. Validate input
      if (!Array.isArray(farmerIds) || farmerIds.length === 0) {
        sendJson(res, 400, {
          success: false,
          error: 'INVALID_INPUT',
          message: 'No farmer IDs provided for bulk calling.',
        });
        return;
      }

      const MAX_BATCH_SIZE = 50;
      if (farmerIds.length > MAX_BATCH_SIZE) {
        sendJson(res, 400, {
          success: false,
          error: 'BATCH_LIMIT_EXCEEDED',
          message: `Batch size (${farmerIds.length}) exceeds maximum limit of ${MAX_BATCH_SIZE} calls.`,
        });
        return;
      }

      // 3. Retrieve farmers from Supabase or fallback store
      const supabase = getSupabaseAdmin();
      let dbFarmers: any[] = [];

      if (supabase) {
        try {
          await supabase
            .from('farmers')
            .update({ status: 'Active', consent_for_advisory: true })
            .or('farmer_id.eq.FG-DEMO-001,phone.eq.7993013756');
        } catch {}

        try {
          const { data } = await supabase
            .from('farmers')
            .select('farmer_id, name, phone, district, taluka, village, primary_crop, preferred_language, consent_for_advisory, status')
            .in('farmer_id', farmerIds);
          if (data) dbFarmers = data;
        } catch {}
      }

      // For any requested farmerIds missing from DB, resolve from REGISTERED_DEMO_FARMERS
      const missingFarmerIds = farmerIds.filter((id) => !dbFarmers.some((f) => f.farmer_id === id));
      if (missingFarmerIds.length > 0) {
        const demoMatches = REGISTERED_DEMO_FARMERS.filter((f) => missingFarmerIds.includes(f.farmer_id || f.id)).map((f: any) => ({
          farmer_id: f.farmer_id || f.id,
          name: f.name,
          phone: f.phone,
          district: f.district || 'Krishna',
          taluka: f.taluka || 'Vijayawada',
          village: f.village || 'IBM',
          primary_crop: f.primary_crop || f.primaryCrop || 'Onion',
          preferred_language: f.preferred_language || f.preferredLanguage || 'te',
          consent_for_advisory: true,
          status: 'Active',
        }));
        dbFarmers = [...dbFarmers, ...demoMatches];
      }

      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      const isTwilioConfigured = Boolean(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);

      const results: any[] = [];
      let queuedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      let eligibleCount = 0;

      for (const farmerId of farmerIds) {
        const farmer = dbFarmers.find((f) => f.farmer_id === farmerId);

        if (!farmer) {
          skippedCount++;
          results.push({
            farmerId,
            farmerName: 'Unknown',
            phone: 'N/A',
            status: 'skipped',
            reason: 'Farmer record not found in registered database.',
          });
          continue;
        }

        // Backend Status Check (Active or verified registered farmer)
        if (farmer.status && !['Active', 'Pending Verification'].includes(farmer.status)) {
          skippedCount++;
          results.push({
            farmerId,
            farmerName: farmer.name,
            phone: farmer.phone ? `+91 ******${farmer.phone.replace(/\D/g, '').slice(-4)}` : 'N/A',
            status: 'skipped',
            reason: `Account status is '${farmer.status}'. Only Active verified farmers can be called.`,
          });
          continue;
        }

        // Advisory Consent Check
        if (farmer.consent_for_advisory !== true) {
          skippedCount++;
          results.push({
            farmerId,
            farmerName: farmer.name,
            phone: farmer.phone ? `+91 ******${farmer.phone.replace(/\D/g, '').slice(-4)}` : 'N/A',
            status: 'skipped',
            reason: 'Advisory consent is not granted by farmer.',
          });
          continue;
        }

        // Phone check
        const cleanDigits = String(farmer.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanDigits.length < 10 || !/^[6-9]\d{9}$/.test(cleanDigits)) {
          skippedCount++;
          results.push({
            farmerId,
            farmerName: farmer.name,
            phone: farmer.phone,
            status: 'skipped',
            reason: 'Invalid 10-digit Indian phone number format.',
          });
          continue;
        }

        eligibleCount++;
        const e164 = `+91${cleanDigits}`;
        const masked = `+91 ******${cleanDigits.slice(-4)}`;

        if (!isTwilioConfigured) {
          failedCount++;
          results.push({
            farmerId,
            farmerName: farmer.name,
            phone: masked,
            status: 'failed',
            error: 'TWILIO_CREDENTIALS_MISSING',
            reason: 'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) not set in .env.',
          });
          continue;
        }

        // Rate limit pacing delay
        if (queuedCount > 0) {
          await new Promise((r) => setTimeout(r, 750));
        }

        try {
          const basicAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
          const requestHost = req.headers.host || 'localhost:5173';
          const requestProto = (req.headers['x-forwarded-proto'] as string) || (requestHost.includes('localhost') ? 'http' : 'https');
          const twimlUrl = process.env.TWILIO_TWIML_URL || `${requestProto}://${requestHost}/api/telephony/twiml/welcome`;

          const params = new URLSearchParams();
          params.append('To', e164);
          params.append('From', twilioPhoneNumber!);
          params.append('Url', twimlUrl);

          const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            }
          );

          const twilioData: any = await twilioRes.json();

          if (!twilioRes.ok || twilioData.error_code || twilioData.status === 'failed') {
            failedCount++;
            const isTrial = twilioData.code === 21216 || twilioData.code === 21217;
            const errMsg = isTrial
              ? 'Twilio Trial Account Restriction: Number is not a verified caller ID in Twilio Console.'
              : twilioData.message || 'Call failed.';

            if (supabase) {
              await supabase.from('farmer_call_logs').insert({
                calling_record_id: `fcr-${farmer.farmer_id}`,
                farmer_id: farmer.farmer_id,
                stage: '3. Farmer & Crop Interaction',
                status: 'Failed',
                summary: `Twilio call failed: ${errMsg}`,
                failure_reason: errMsg,
                call_purpose: callPurpose,
                batch_id: batchId,
                initiated_by: adminEmail || 'Admin',
              });
            }

            results.push({
              farmerId,
              farmerName: farmer.name,
              phone: masked,
              status: 'failed',
              error: isTrial ? 'TWILIO_TRIAL_UNVERIFIED_NUMBER' : 'TWILIO_DISPATCH_FAILED',
              reason: errMsg,
            });
          } else {
            queuedCount++;
            const callSid = twilioData.sid;

            if (supabase) {
              await supabase.from('farmer_calling_records').upsert({
                id: `fcr-${farmer.farmer_id}`,
                farmer_id: farmer.farmer_id,
                farmer_name: farmer.name,
                phone: farmer.phone,
                village: farmer.village || '',
                taluka: farmer.taluka || '',
                district: farmer.district || '',
                selected_crop: farmer.primary_crop || 'Onion',
                consent_for_advisory: true,
                preferred_language: farmer.preferred_language || 'mr',
                current_stage: '3. Farmer & Crop Interaction',
                call_status: 'Calling',
                last_call_date: new Date().toISOString().split('T')[0],
                last_call_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'farmer_id' });

              await supabase.from('farmer_call_logs').insert({
                calling_record_id: `fcr-${farmer.farmer_id}`,
                farmer_id: farmer.farmer_id,
                call_sid: callSid,
                stage: '3. Farmer & Crop Interaction',
                status: 'Calling',
                summary: `Outbound AI advisory call dispatched via Twilio. SID: ${callSid}`,
                call_purpose: callPurpose,
                batch_id: batchId,
                initiated_by: adminEmail || 'Admin',
              });
            }

            results.push({
              farmerId,
              farmerName: farmer.name,
              phone: masked,
              status: 'queued',
              callSid,
              message: 'Outbound call queued with Twilio Voice Gateway.',
            });
          }
        } catch (err: any) {
          failedCount++;
          results.push({
            farmerId,
            farmerName: farmer.name,
            phone: masked,
            status: 'failed',
            error: 'CARRIER_EXCEPTION',
            reason: err?.message || 'Error connecting to Twilio.',
          });
        }
      }

      // Save batch summary if supabase available
      if (supabase) {
        try {
          await supabase.from('bulk_call_batches').insert({
            id: batchId,
            admin_id: adminEmail || 'Admin',
            call_purpose: callPurpose,
            total_selected: farmerIds.length,
            total_eligible: eligibleCount,
            queued_count: queuedCount,
            completed_count: 0,
            failed_count: failedCount,
            skipped_count: skippedCount,
            status: failedCount === 0 && skippedCount === 0 ? 'Completed' : queuedCount > 0 ? 'Partial Failure' : 'Failed',
            results,
          });
        } catch {
          // Ignore if bulk_call_batches table migration not applied yet
        }
      }

      sendJson(res, 200, {
        success: true,
        batchId,
        callPurpose,
        totalSelected: farmerIds.length,
        totalEligible: eligibleCount,
        queuedCount,
        failedCount,
        skippedCount,
        results,
      });
      return;
    } catch (err: any) {
      console.error('[API] /api/telephony/bulk-make-calls exception:', err);
      sendJson(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'Error processing bulk call request.',
      });
      return;
    }
  }

  // Route 5.3: Query Call History & Batches
  if (url.startsWith('/api/telephony/call-history') && req.method === 'GET') {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: logs } = await supabase
          .from('farmer_call_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: batches } = await supabase
          .from('bulk_call_batches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        sendJson(res, 200, {
          success: true,
          logs: logs || [],
          batches: batches || [],
        });
        return;
      }

      sendJson(res, 200, { success: true, logs: [], batches: [] });
      return;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return;
    }
  }

  // Route 6: Fetch Authenticated Farmer's Actual Record from Supabase
  if ((url.startsWith('/api/farmer/me') || url === '/api/farmer/me') && (req.method === 'GET' || req.method === 'POST')) {
    try {
      let farmerId: string | undefined;
      let phone: string | undefined;

      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        farmerId = body.farmerId;
        phone = body.phone;
      } else {
        const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
        farmerId = parsedUrl.searchParams.get('farmerId') || undefined;
        phone = parsedUrl.searchParams.get('phone') || undefined;
      }

      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : undefined;

      const supabase = getSupabaseAdmin();
      let actualFarmer: any = null;

      if (supabase) {
        let query = supabase.from('farmers').select('*');
        if (farmerId) {
          query = query.eq('farmer_id', farmerId);
        } else if (cleanPhone) {
          query = query.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
        }

        const { data, error } = await query.maybeSingle();
        if (error) {
          console.warn('[API] /api/farmer/me Supabase error:', error.message);
        } else if (data) {
          actualFarmer = {
            id: data.farmer_id,
            name: data.name,
            phone: data.phone,
            state: data.state || 'Maharashtra',
            district: data.district || '',
            taluka: data.taluka || '',
            village: data.village || '',
            primaryCrop: data.primary_crop || 'Onion',
            landAreaAcres: Number(data.land_area_acres) || 0,
            expectedHarvestQuintals: Number(data.expected_harvest_quintals) || 0,
            preferredLanguage: data.preferred_language || 'mr',
            consentForAdvisory: data.consent_for_advisory !== false,
            registeredDate: data.registration_date || new Date().toISOString().split('T')[0],
            status: data.status,
            assignedOfficerId: data.assigned_officer_id,
          };
        }
      }

      if (!actualFarmer) {
        // Fallback to verified local register list if Supabase credentials pending
        const match = REGISTERED_DEMO_FARMERS.find(
          (f) =>
            (farmerId && (f.id === farmerId || f.farmer_id === farmerId)) ||
            (cleanPhone && f.phone.replace(/\D/g, '').endsWith(cleanPhone))
        );
        const m = match as any;
        if (m) {
          actualFarmer = {
            id: m.id || m.farmer_id,
            name: m.name,
            phone: m.phone,
            state: m.state || 'Maharashtra',
            district: m.district || '',
            taluka: m.taluka || '',
            village: m.village || '',
            primaryCrop: m.primaryCrop || m.primary_crop || 'Onion',
            landAreaAcres: Number(m.landAreaAcres || m.land_area_acres) || 0,
            expectedHarvestQuintals: Number(m.expectedHarvestQuintals) || 0,
            preferredLanguage: m.preferredLanguage || m.preferred_language || 'mr',
            consentForAdvisory: m.consentForAdvisory !== false,
            registeredDate: m.registeredDate || m.registration_date || new Date().toISOString().split('T')[0],
            status: m.status || 'Active',
          };
        }
      }

      if (!actualFarmer) {
        sendJson(res, 404, {
          success: false,
          error: 'NOT_FOUND',
          message: 'No registered farmer profile found for this phone number.',
        });
        return;
      }

      sendJson(res, 200, {
        success: true,
        farmer: actualFarmer,
      });
      return;
    } catch (err: any) {
      console.error('[API] /api/farmer/me exception:', err);
      sendJson(res, 500, {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Could not fetch farmer record.',
      });
      return;
    }
  }

  // Route 7: Cold Storage Appointments CRUD & Workflow Handlers
  if (url.startsWith('/api/storage/appointments')) {
    const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // GET: Query appointments by farmer or facility
    if (req.method === 'GET') {
      try {
        const farmerId = parsedUrl.searchParams.get('farmerId');
        const facilityId = parsedUrl.searchParams.get('facilityId');
        const supabase = getSupabaseAdmin();

        if (supabase) {
          let query = supabase.from('storage_appointments').select('*').order('created_at', { ascending: false });
          if (farmerId) query = query.eq('farmer_id', farmerId);
          if (facilityId) query = query.eq('facility_id', facilityId);

          const { data, error } = await query;
          if (!error && data) {
            sendJson(res, 200, { success: true, appointments: data });
            return;
          }
        }

        // Fallback response if database schema not yet run
        sendJson(res, 200, { success: true, appointments: [], note: 'Using client-side persistent storage' });
        return;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return;
      }
    }

    // POST: Create or Update appointment
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const supabase = getSupabaseAdmin();

        // Sub-route: Update status (approve, reject, reschedule, accept)
        if (pathname.endsWith('/update-status')) {
          const { id, status, confirmedDate, confirmedTime, proposedAlternativeDate, proposedAlternativeTime, rejectionReason, note } = body;
          if (!id || !status) {
            sendJson(res, 400, { success: false, message: 'Missing appointment ID or status' });
            return;
          }

          if (supabase) {
            const updatePayload: any = { status, updated_at: new Date().toISOString() };
            if (confirmedDate) updatePayload.confirmed_date = confirmedDate;
            if (confirmedTime) updatePayload.confirmed_time = confirmedTime;
            if (proposedAlternativeDate) updatePayload.proposed_alternative_date = proposedAlternativeDate;
            if (proposedAlternativeTime) updatePayload.proposed_alternative_time = proposedAlternativeTime;
            if (rejectionReason) updatePayload.rejection_reason = rejectionReason;
            if (note) updatePayload.additional_details = note;

            await supabase.from('storage_appointments').update(updatePayload).eq('id', id);
          }

          sendJson(res, 200, { success: true, message: `Appointment status updated to ${status}` });
          return;
        }

        // Default POST: Create appointment
        if (supabase) {
          await supabase.from('storage_appointments').insert({
            id: body.id,
            farmer_id: body.farmerId,
            farmer_name: body.farmerName,
            farmer_phone: body.farmerPhone,
            facility_id: body.facilityId,
            facility_name: body.facilityName,
            crop: body.crop,
            quantity_quintals: body.quantityQuintals,
            preferred_date: body.preferredDate,
            preferred_time: body.preferredTime,
            additional_details: body.additionalDetails,
            status: 'Pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        sendJson(res, 200, { success: true, message: 'Appointment registered successfully.' });
        return;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return;
      }
    }
  }

  // If not handled, pass to next middleware (Vite frontend)
  next();
}


