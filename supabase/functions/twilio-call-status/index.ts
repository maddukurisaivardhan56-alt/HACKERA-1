// Supabase Edge Function: twilio-call-status
// Webhook endpoint for Twilio Voice Status Callbacks
// Deploy command: supabase functions deploy twilio-call-status
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response('Config missing', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload (Twilio sends application/x-www-form-urlencoded by default)
    const contentType = req.headers.get('content-type') || '';
    let callSid = '';
    let callStatus = '';
    let callDuration = 0;
    let digits = '';
    let speechResult = '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      callSid = formData.get('CallSid')?.toString() || '';
      callStatus = formData.get('CallStatus')?.toString() || '';
      callDuration = parseInt(formData.get('CallDuration')?.toString() || '0', 10);
      digits = formData.get('Digits')?.toString() || '';
      speechResult = formData.get('SpeechResult')?.toString() || '';
    } else {
      const json = await req.json().catch(() => ({}));
      callSid = json.CallSid || json.callSid || '';
      callStatus = json.CallStatus || json.callStatus || '';
      callDuration = parseInt(json.CallDuration || json.callDuration || '0', 10);
      digits = json.Digits || json.digits || '';
      speechResult = json.SpeechResult || json.speechResult || '';
    }

    if (!callSid) {
      return new Response(JSON.stringify({ error: 'Missing CallSid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map Twilio carrier status to internal IndividualCallStatus
    let mappedStatus = 'Calling';
    if (callStatus === 'completed') {
      mappedStatus = 'Completed';
    } else if (callStatus === 'in-progress' || callStatus === 'answered') {
      mappedStatus = 'Connected';
    } else if (callStatus === 'no-answer') {
      mappedStatus = 'Failed';
    } else if (callStatus === 'busy' || callStatus === 'failed' || callStatus === 'canceled') {
      mappedStatus = 'Failed';
    }

    // 1. Update matching farmer_call_logs record
    const { data: updatedLogs, error: _logError } = await supabase
      .from('farmer_call_logs')
      .update({
        status: mappedStatus,
        duration_seconds: callDuration,
        summary: `Carrier call update: status is ${callStatus}, duration: ${callDuration}s.${digits ? ` DTMF: ${digits}` : ''}${speechResult ? ` Transcript: ${speechResult}` : ''}`,
      })
      .eq('call_sid', callSid)
      .select('farmer_id, batch_id');

    // 2. Update parent farmer_calling_records
    if (updatedLogs && updatedLogs.length > 0) {
      const farmerId = updatedLogs[0].farmer_id;
      const batchId = updatedLogs[0].batch_id;

      await supabase
        .from('farmer_calling_records')
        .update({
          call_status: mappedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('farmer_id', farmerId);

      // If completed, increment completed_count in bulk_call_batches
      if (mappedStatus === 'Completed' && batchId) {
        await supabase.rpc('increment_batch_completed_count', { target_batch_id: batchId }).catch(async () => {
          // Fallback manual query
          const { data: batch } = await supabase.from('bulk_call_batches').select('completed_count').eq('id', batchId).maybeSingle();
          if (batch) {
            await supabase.from('bulk_call_batches').update({
              completed_count: (batch.completed_count || 0) + 1,
              updated_at: new Date().toISOString(),
            }).eq('id', batchId);
          }
        });
      }

      // 3. Problem Detection / Support Integration:
      // If farmer pressed '1' (requested help) or reported problems (pests, disease, irrigation)
      const hasReportedIssue = digits === '1' ||
        speechResult.toLowerCase().includes('pest') ||
        speechResult.toLowerCase().includes('water') ||
        speechResult.toLowerCase().includes('disease') ||
        speechResult.toLowerCase().includes('कीड') ||
        speechResult.toLowerCase().includes('रोग');

      if (hasReportedIssue) {
        // Fetch farmer profile details
        const { data: farmer } = await supabase
          .from('farmers')
          .select('*')
          .eq('farmer_id', farmerId)
          .maybeSingle();

        if (farmer) {
          const complaintId = `CMP-CALL-${Date.now().toString().slice(-4)}`;
          await supabase.from('farmer_support_requests').insert({
            id: complaintId,
            farmer_id: farmer.farmer_id,
            farmer_name: farmer.name,
            phone: farmer.phone,
            village: farmer.village || '',
            taluka: farmer.taluka || '',
            district: farmer.district || '',
            crop: farmer.primary_crop || 'Onion',
            subject: `Agricultural Problem identified during AI Call (SID: ${callSid})`,
            issue_category: speechResult.toLowerCase().includes('water') ? 'Irrigation & Weather' : 'Pest & Disease',
            description: speechResult
              ? `Farmer reported issue during AI Call: "${speechResult}". Follow-up inspection required.`
              : `Farmer pressed DTMF key 1 requesting officer support and pest/disease consultation during automated advisory call.`,
            status: 'Open', // Strictly Open; never automatically marked resolved
            priority: 'High',
            assigned_officer_id: farmer.assigned_officer_id || 'AO-MH-NSK-1042',
            appointment_status: 'Appointment Pending',
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, callSid, mappedStatus }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
