// Supabase Edge Function: send-farmer-otp
// Deploy command: supabase functions deploy send-farmer-otp
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
    const { phone } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: 'INVALID_PHONE', message: 'Phone number is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Normalize Indian Phone
    const digits = String(phone).replace(/\D/g, '');
    let phone10 = '';
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
      phone10 = digits;
    } else if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
      phone10 = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
      phone10 = digits.slice(2);
    } else {
      return new Response(JSON.stringify({ success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit Indian mobile number.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const e164 = `+91${phone10}`;
    const maskedPhone = `+91 ******${phone10.slice(-4)}`;

    // 2. Check registration in Supabase public.farmers using Service Role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('farmer_id, name, phone, status')
      .or(`phone.eq.${phone10},phone.eq.${e164}`)
      .maybeSingle();

    if (farmerError || !farmer || !['Active', 'Pending Verification'].includes(farmer.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'NOT_REGISTERED',
        message: 'This mobile number is not registered. Farmers must be registered through the authorized government registration process by an Agriculture Officer.',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Dispatch OTP via 2Factor AUTOGEN API
    const apiKey = Deno.env.get('TWOFACTOR_API_KEY');
    const template = Deno.env.get('TWOFACTOR_OTP_TEMPLATE');

    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'SERVICE_UNCONFIGURED', message: 'TWOFACTOR_API_KEY not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const endpoint = template
      ? `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(e164)}/AUTOGEN/${encodeURIComponent(template)}`
      : `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(e164)}/AUTOGEN`;

    const twoFactorRes = await fetch(endpoint);
    const twoFactorData = await twoFactorRes.json();

    if (!twoFactorRes.ok || twoFactorData.Status !== 'Success') {
      return new Response(JSON.stringify({
        success: false,
        error: 'SMS_GATEWAY_ERROR',
        message: twoFactorData?.Details || 'Failed to dispatch verification SMS via 2Factor.',
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionId = twoFactorData.Details;

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      maskedPhone,
      cooldownSeconds: 45,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'SERVER_ERROR', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
