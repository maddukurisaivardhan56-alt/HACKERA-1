import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Authorized registered farmers from SIH.csv (pre-registered by staff/officer)
export const REGISTERED_DEMO_FARMERS = [
  {
    id: 'FG-DEMO-001',
    farmer_id: 'FG-DEMO-001',
    name: 'MADDUKURI SAI VARDHAN',
    phone: '7993013756',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada',
    village: 'IBM',
    primary_crop: 'ONION',
    primaryCrop: 'ONION',
    land_area_acres: 100.0,
    landAreaAcres: 100.0,
    expectedHarvestQuintals: 450,
    preferred_language: 'te',
    preferredLanguage: 'te',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-DEMO-002',
    farmer_id: 'FG-DEMO-002',
    name: 'BORRA AKHILA',
    phone: '9704316533',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada',
    village: 'IBM',
    primary_crop: 'ONION',
    primaryCrop: 'ONION',
    land_area_acres: 100.0,
    landAreaAcres: 100.0,
    expectedHarvestQuintals: 400,
    preferred_language: 'te',
    preferredLanguage: 'te',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-DEMO-003',
    farmer_id: 'FG-DEMO-003',
    name: 'BORRA ALEKHYA',
    phone: '6303381553',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada',
    village: 'IBM',
    primary_crop: 'ONION',
    primaryCrop: 'ONION',
    land_area_acres: 100.0,
    landAreaAcres: 100.0,
    expectedHarvestQuintals: 420,
    preferred_language: 'te',
    preferredLanguage: 'te',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-DEMO-004',
    farmer_id: 'FG-DEMO-004',
    name: 'BUGGA PRATHIBA',
    phone: '7396972396',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada',
    village: 'IBM',
    primary_crop: 'ONION',
    primaryCrop: 'ONION',
    land_area_acres: 100.0,
    landAreaAcres: 100.0,
    expectedHarvestQuintals: 380,
    preferred_language: 'te',
    preferredLanguage: 'te',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-DEMO-005',
    farmer_id: 'FG-DEMO-005',
    name: 'TRILEKHA',
    phone: '8520888389',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada',
    village: 'IBM',
    primary_crop: 'ONION',
    primaryCrop: 'ONION',
    land_area_acres: 100.0,
    landAreaAcres: 100.0,
    expectedHarvestQuintals: 410,
    preferred_language: 'te',
    preferredLanguage: 'te',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-DEMO-006',
    farmer_id: 'FG-DEMO-006',
    name: 'NISCHAL',
    phone: '8142068003',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    taluka: 'Vijayawada',
    village: 'IBM',
    primary_crop: 'ONION',
    primaryCrop: 'ONION',
    land_area_acres: 100.0,
    landAreaAcres: 100.0,
    expectedHarvestQuintals: 430,
    preferred_language: 'te',
    preferredLanguage: 'te',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-001',
    farmer_id: 'FG-MH-001',
    name: 'Ramesh Patil',
    phone: '9822012345',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Pimpalgaon',
    primary_crop: 'Onion',
    primaryCrop: 'Onion',
    land_area_acres: 2.5,
    landAreaAcres: 2.5,
    expectedHarvestQuintals: 180,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-002',
    farmer_id: 'FG-MH-002',
    name: 'Suresh Jagtap',
    phone: '9822023456',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Lasalgaon',
    primary_crop: 'Onion',
    primaryCrop: 'Onion',
    land_area_acres: 3.0,
    landAreaAcres: 3.0,
    expectedHarvestQuintals: 220,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-003',
    farmer_id: 'FG-MH-003',
    name: 'Nitin Shinde',
    phone: '9822034567',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Ozar',
    primary_crop: 'Tomato',
    primaryCrop: 'Tomato',
    land_area_acres: 1.5,
    landAreaAcres: 1.5,
    expectedHarvestQuintals: 140,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-004',
    farmer_id: 'FG-MH-004',
    name: 'Babasaheb Gite',
    phone: '9822045678',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Chandori',
    primary_crop: 'Grapes',
    primaryCrop: 'Grapes',
    land_area_acres: 4.0,
    landAreaAcres: 4.0,
    expectedHarvestQuintals: 310,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-005',
    farmer_id: 'FG-MH-005',
    name: 'Dnyaneshwar Khairnar',
    phone: '9822056789',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Niphad Rural',
    primary_crop: 'Wheat',
    primaryCrop: 'Wheat',
    land_area_acres: 2.0,
    landAreaAcres: 2.0,
    expectedHarvestQuintals: 160,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-006',
    farmer_id: 'FG-MH-006',
    name: 'Sunita Wagh',
    phone: '9822067890',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Pimpalgaon',
    primary_crop: 'Soybean',
    primaryCrop: 'Soybean',
    land_area_acres: 1.8,
    landAreaAcres: 1.8,
    expectedHarvestQuintals: 95,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-007',
    farmer_id: 'FG-MH-007',
    name: 'Ganesh Shinde',
    phone: '9822167890',
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Ozar',
    primary_crop: 'Tomato',
    primaryCrop: 'Tomato',
    land_area_acres: 2.0,
    landAreaAcres: 2.0,
    expectedHarvestQuintals: 155,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-008',
    farmer_id: 'FG-MH-008',
    name: 'Vijay Jadhav',
    phone: '9823411223',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Baramati',
    village: 'Baramati',
    primary_crop: 'Pomegranate',
    primaryCrop: 'Pomegranate',
    land_area_acres: 3.0,
    landAreaAcres: 3.0,
    expectedHarvestQuintals: 210,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
  {
    id: 'FG-MH-009',
    farmer_id: 'FG-MH-009',
    name: 'Sunita Deshmukh',
    phone: '9822954321',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    taluka: 'Rahata',
    village: 'Rahata',
    primary_crop: 'Soybean',
    primaryCrop: 'Soybean',
    land_area_acres: 4.5,
    landAreaAcres: 4.5,
    expectedHarvestQuintals: 280,
    preferred_language: 'mr',
    preferredLanguage: 'mr',
    consentForAdvisory: true,
    status: 'Active',
  },
];

// In-memory OTP transaction entry
export interface OtpTransaction {
  sessionId: string;
  phone: string;
  normalizedPhone: string;
  farmerId: string;
  createdAt: number;
  expiresAt: number;
  resendCooldownUntil: number;
  attempts: number;
  verified: boolean;
}

// In-memory Rate Limiting entry
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitsByIp = new Map<string, RateLimitRecord>();
const rateLimitsByPhone = new Map<string, RateLimitRecord>();

// OTP Transactions store
const otpSessions = new Map<string, OtpTransaction>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds
const MAX_VERIFY_ATTEMPTS = 3;
const MAX_REQUESTS_PER_IP = 5;
const MAX_REQUESTS_PER_PHONE = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Strict canonical Indian phone normalization.
 * Handles formats: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX.
 * Returns both 10-digit format and canonical E.164 (+91XXXXXXXXXX).
 */
export function normalizeIndianPhone(input: string): {
  isValid: boolean;
  phone10: string;
  e164: string;
  maskedPhone: string;
} {
  if (!input || typeof input !== 'string') {
    return { isValid: false, phone10: '', e164: '', maskedPhone: '' };
  }

  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  let phone10 = '';

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    phone10 = digits;
  } else if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    phone10 = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    phone10 = digits.slice(2);
  } else {
    return { isValid: false, phone10: '', e164: '', maskedPhone: '' };
  }

  const e164 = `+91${phone10}`;
  const maskedPhone = `+91 ******${phone10.slice(-4)}`;

  return {
    isValid: true,
    phone10,
    e164,
    maskedPhone,
  };
}

/**
 * Rate limiting check for IP and phone number.
 */
function checkRateLimit(key: string, map: Map<string, RateLimitRecord>, maxRequests: number): boolean {
  const now = Date.now();
  const record = map.get(key);

  if (!record || now > record.resetTime) {
    map.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Get configured Supabase Admin client.
 * Uses SUPABASE_SERVICE_ROLE_KEY if provided, otherwise falls back to VITE_SUPABASE_ANON_KEY.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a secure HMAC signature for session tokens
 */
export function createSessionToken(farmerId: string, phone: string): string {
  const secret = process.env.SESSION_SECRET || 'fg_secure_secret_farmer_auth_2026';
  const payload = JSON.stringify({
    farmerId,
    phone,
    role: 'farmer',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

export const OtpService = {
  /**
   * Step 1: Request OTP
   * - Validates phone number
   * - Rate limits
   * - Checks if farmer is registered in public.farmers
   * - Dispatches OTP via 2Factor AUTOGEN API
   * - Stores transaction reference
   */
  async requestOtp(
    rawPhone: string,
    clientIp: string
  ): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    sessionId?: string;
    maskedPhone?: string;
    cooldownSeconds?: number;
  }> {
    // 1. Normalize phone
    const { isValid, phone10, e164, maskedPhone } = normalizeIndianPhone(rawPhone);
    if (!isValid) {
      return {
        success: false,
        error: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit Indian mobile number.',
      };
    }

    // 2. Rate limit checks
    if (!checkRateLimit(clientIp, rateLimitsByIp, MAX_REQUESTS_PER_IP)) {
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP requests from this network. Please wait a few minutes before trying again.',
      };
    }

    if (!checkRateLimit(phone10, rateLimitsByPhone, MAX_REQUESTS_PER_PHONE)) {
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP requests for this mobile number. Please wait a few minutes before trying again.',
      };
    }

    // 3. Resend cooldown check on active session
    for (const [existingSessionId, session] of otpSessions.entries()) {
      if (session.phone === phone10 && !session.verified && Date.now() < session.expiresAt) {
        if (Date.now() < session.resendCooldownUntil) {
          const remainingSeconds = Math.ceil((session.resendCooldownUntil - Date.now()) / 1000);
          return {
            success: false,
            error: 'COOLDOWN_ACTIVE',
            message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
            cooldownSeconds: remainingSeconds,
          };
        }
        // Invalidate older session for this phone to issue a fresh one
        otpSessions.delete(existingSessionId);
      }
    }

    // 4. Check registered farmer in Supabase public.farmers
    const supabase = getSupabaseAdmin();
    let registeredFarmer: any = null;

    if (supabase) {
      try {
        // Query by 10-digit number or canonical E.164
        const { data, error } = await supabase
          .from('farmers')
          .select('farmer_id, name, phone, status')
          .or(`phone.eq.${phone10},phone.eq.${e164}`)
          .maybeSingle();

        if (error) {
          console.warn('[OtpService] Supabase farmers query note:', error.message);
          // Try RPC check_farmer_registered if direct SELECT is restricted by RLS
          const { data: rpcRegistered } = await supabase.rpc('check_farmer_registered', { p_phone: phone10 });
          if (rpcRegistered) {
            registeredFarmer = { farmer_id: `FG-REG-${phone10.slice(-4)}`, phone: phone10, status: 'Active' };
          }
        } else if (data) {
          if (data.status === 'Active' || data.status === 'Pending Verification') {
            registeredFarmer = data;
          }
        }
      } catch (err: any) {
        console.error('[OtpService] Supabase connection error:', err.message);
      }
    }

    // Fallback to pre-registered demo farmers list (from SIH.csv) if DB service credentials pending
    if (!registeredFarmer) {
      const match = REGISTERED_DEMO_FARMERS.find(
        (f) => f.phone.replace(/\D/g, '').endsWith(phone10) && (f.status === 'Active' || f.status === 'Pending Verification')
      );
      if (match) {
        registeredFarmer = {
          farmer_id: match.id,
          name: match.name,
          phone: match.phone,
          status: match.status,
        };
      }
    }

    // Strict no self-registration: If farmer is not registered, do not dispatch OTP!
    if (!registeredFarmer) {
      return {
        success: false,
        error: 'NOT_REGISTERED',
        message: 'This mobile number is not registered. Farmers must be registered through the authorized government registration process by an Agriculture Officer.',
      };
    }

    // 5. Check 2Factor API Key
    const apiKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_OTP_TEMPLATE;

    if (!apiKey) {
      console.error('[OtpService] TWOFACTOR_API_KEY environment variable is not configured.');
      return {
        success: false,
        error: 'SERVICE_UNCONFIGURED',
        message: 'SMS Gateway service is not configured. Please configure TWOFACTOR_API_KEY in the server environment.',
      };
    }

    // 6. Call 2Factor AUTOGEN API
    // Endpoint: https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/AUTOGEN or with template
    const endpoint = templateName
      ? `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(e164)}/AUTOGEN/${encodeURIComponent(templateName)}`
      : `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(e164)}/AUTOGEN`;

    try {
      console.log(`[OtpService] Dispatching 2Factor OTP to ${maskedPhone}...`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const data: any = await response.json().catch(() => null);

      if (!response.ok || !data || data.Status !== 'Success') {
        console.error('[OtpService] 2Factor AUTOGEN API error:', data || response.statusText);
        return {
          success: false,
          error: 'SMS_GATEWAY_ERROR',
          message: data?.Details || 'Failed to dispatch verification SMS via 2Factor gateway. Please try again.',
        };
      }

      const sessionId = data.Details; // 2Factor session GUID
      const now = Date.now();

      // 7. Store OTP transaction
      otpSessions.set(sessionId, {
        sessionId,
        phone: phone10,
        normalizedPhone: e164,
        farmerId: registeredFarmer.farmer_id,
        createdAt: now,
        expiresAt: now + OTP_EXPIRY_MS,
        resendCooldownUntil: now + RESEND_COOLDOWN_MS,
        attempts: 0,
        verified: false,
      });

      // Cleanup expired sessions older than 15 minutes
      for (const [id, s] of otpSessions.entries()) {
        if (now > s.expiresAt + 10 * 60 * 1000) {
          otpSessions.delete(id);
        }
      }

      return {
        success: true,
        sessionId,
        maskedPhone,
        cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
      };
    } catch (fetchErr: any) {
      console.error('[OtpService] Network error calling 2Factor API:', fetchErr);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Could not connect to SMS gateway. Please check your network connection.',
      };
    }
  },

  /**
   * Step 2: Verify OTP
   * - Validates session
   * - Enforces max attempts (max 3)
   * - Calls 2Factor VERIFY API
   * - Fetches farmer profile from Supabase
   * - Returns authentic session token and profile
   */
  async verifyOtp(
    sessionId: string,
    enteredOtp: string,
    _rawPhone?: string
  ): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    farmer?: any;
    token?: string;
  }> {
    if (!sessionId || !enteredOtp) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: 'Session ID and verification OTP are required.',
      };
    }

    const cleanOtp = enteredOtp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      return {
        success: false,
        error: 'INVALID_OTP_FORMAT',
        message: 'Please enter the 6-digit OTP received via SMS.',
      };
    }

    const session = otpSessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'OTP session expired or invalid. Please request a new verification code.',
      };
    }

    // Check expiry
    if (Date.now() > session.expiresAt) {
      otpSessions.delete(sessionId);
      return {
        success: false,
        error: 'OTP_EXPIRED',
        message: 'Verification code has expired. Please request a new OTP.',
      };
    }

    // Check attempts
    if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
      otpSessions.delete(sessionId);
      return {
        success: false,
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. For security, please request a new OTP.',
      };
    }

    session.attempts += 1;

    // Call 2Factor VERIFY API
    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'SERVICE_UNCONFIGURED',
        message: 'TWOFACTOR_API_KEY is not configured on server.',
      };
    }

    // Endpoint: https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp_entered_by_user}
    const verifyEndpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(cleanOtp)}`;

    try {
      console.log(`[OtpService] Verifying OTP for session ${sessionId} via 2Factor...`);
      const response = await fetch(verifyEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const data: any = await response.json().catch(() => null);

      if (!response.ok || !data || data.Status !== 'Success' || data.Details !== 'OTP Matched') {
        const remainingAttempts = MAX_VERIFY_ATTEMPTS - session.attempts;
        console.warn('[OtpService] OTP verification mismatch:', data?.Details || 'OTP Mismatch');

        if (remainingAttempts > 0) {
          return {
            success: false,
            error: 'INVALID_OTP',
            message: `Incorrect OTP. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`,
          };
        } else {
          otpSessions.delete(sessionId);
          return {
            success: false,
            error: 'MAX_ATTEMPTS_EXCEEDED',
            message: 'Incorrect OTP. Maximum attempts exceeded. Please request a new code.',
          };
        }
      }

      // OTP Matched successfully!
      session.verified = true;
      otpSessions.delete(sessionId); // Invalidate used OTP session

      // Retrieve farmer record from Supabase
      const supabase = getSupabaseAdmin();
      let farmerRecord: any = null;

      if (supabase) {
        const { data: dbFarmer, error: fetchErr } = await supabase
          .from('farmers')
          .select('*')
          .eq('farmer_id', session.farmerId)
          .maybeSingle();

        if (fetchErr) {
          console.warn('[OtpService] Supabase fetch error for verified farmer:', fetchErr.message);
        } else if (dbFarmer) {
          farmerRecord = {
            id: dbFarmer.farmer_id,
            name: dbFarmer.name,
            phone: dbFarmer.phone,
            state: dbFarmer.state || 'Maharashtra',
            district: dbFarmer.district || '',
            taluka: dbFarmer.taluka || '',
            village: dbFarmer.village || '',
            primaryCrop: dbFarmer.primary_crop || 'Onion',
            landAreaAcres: Number(dbFarmer.land_area_acres) || 0,
            expectedHarvestQuintals: Number(dbFarmer.expected_harvest_quintals) || 0,
            preferredLanguage: dbFarmer.preferred_language || 'mr',
            consentForAdvisory: dbFarmer.consent_for_advisory !== false,
            registeredDate: dbFarmer.registration_date || new Date().toISOString().split('T')[0],
            status: dbFarmer.status,
          };
        }
      }

      if (!farmerRecord) {
        const localMatch = REGISTERED_DEMO_FARMERS.find((f) => f.id === session.farmerId);
        if (localMatch) {
          farmerRecord = {
            id: localMatch.id,
            name: localMatch.name,
            phone: localMatch.phone,
            state: localMatch.state,
            district: localMatch.district,
            taluka: localMatch.taluka,
            village: localMatch.village,
            primaryCrop: localMatch.primaryCrop,
            landAreaAcres: localMatch.landAreaAcres,
            expectedHarvestQuintals: localMatch.expectedHarvestQuintals,
            preferredLanguage: localMatch.preferredLanguage,
            consentForAdvisory: localMatch.consentForAdvisory,
            registeredDate: '2026-09-21',
            status: localMatch.status,
          };
        }
      }

      if (!farmerRecord) {
        return {
          success: false,
          error: 'PROFILE_NOT_FOUND',
          message: 'OTP verified, but registered profile could not be loaded from database.',
        };
      }

      // Generate authentic session token
      const token = createSessionToken(farmerRecord.id, farmerRecord.phone);

      return {
        success: true,
        farmer: farmerRecord,
        token,
      };
    } catch (err: any) {
      console.error('[OtpService] Error verifying OTP via 2Factor:', err);
      return {
        success: false,
        error: 'VERIFICATION_ERROR',
        message: 'An error occurred while verifying the code. Please try again.',
      };
    }
  },

  /**
   * Register a new farmer into system so they can log in via OTP
   */
  registerFarmer(profile: {
    name: string;
    phone: string;
    district: string;
    taluka?: string;
    village?: string;
    state?: string;
    primaryCrop?: string;
    preferredLanguage?: string;
    landAreaAcres?: number;
  }): { success: boolean; farmer: any } {
    const cleanPhone = profile.phone.replace(/\D/g, '').slice(-10);
    const existing = REGISTERED_DEMO_FARMERS.find(
      (f) => f.phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );
    if (existing) {
      existing.name = profile.name;
      existing.district = profile.district;
      existing.taluka = profile.taluka || existing.taluka;
      existing.primaryCrop = profile.primaryCrop || existing.primaryCrop;
      existing.primary_crop = profile.primaryCrop || existing.primary_crop;
      existing.preferredLanguage = profile.preferredLanguage || existing.preferredLanguage;
      existing.preferred_language = profile.preferredLanguage || existing.preferred_language;
      return { success: true, farmer: existing };
    }

    const id = `FG-REG-${Date.now().toString().slice(-5)}`;
    const record = {
      id,
      farmer_id: id,
      name: profile.name,
      phone: cleanPhone,
      state: profile.state || 'Maharashtra',
      district: profile.district,
      taluka: profile.taluka || '',
      village: profile.village || '',
      primary_crop: profile.primaryCrop || 'Onion',
      primaryCrop: profile.primaryCrop || 'Onion',
      land_area_acres: profile.landAreaAcres || 2.0,
      landAreaAcres: profile.landAreaAcres || 2.0,
      expectedHarvestQuintals: 100,
      preferred_language: profile.preferredLanguage || 'mr',
      preferredLanguage: profile.preferredLanguage || 'mr',
      consentForAdvisory: true,
      status: 'Active',
      registeredDate: new Date().toISOString().split('T')[0],
    };

    REGISTERED_DEMO_FARMERS.unshift(record);
    return { success: true, farmer: record };
  },
};

