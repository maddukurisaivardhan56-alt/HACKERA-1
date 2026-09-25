// Supabase Edge Function: verify-farmer-otp
// Deploy command: supabase functions deploy verify-farmer-otp
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
    const { sessionId, otp, phone } = await req.json();
    if (!sessionId || !otp) {
      return new Response(JSON.stringify({ success: false, error: 'INVALID_INPUT', message: 'Session ID and OTP are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanOtp = String(otp).trim().replace(/\D/g, '');
    const apiKey = Deno.env.get('TWOFACTOR_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'SERVICE_UNCONFIGURED', message: 'TWOFACTOR_API_KEY not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call 2Factor VERIFY API
    const verifyEndpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(cleanOtp)}`;
    const verifyRes = await fetch(verifyEndpoint);
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.Status !== 'Success' || verifyData.Details !== 'OTP Matched') {
      return new Response(JSON.stringify({
        success: false,
        error: 'INVALID_OTP',
        message: verifyData?.Details || 'Incorrect or expired OTP.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retrieve farmer record from Supabase public.farmers
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const digits = String(phone || '').replace(/\D/g, '').slice(-10);
    const { data: farmer, error: fetchError } = await supabase
      .from('farmers')
      .select('*')
      .eq('phone', digits)
      .maybeSingle();

    if (fetchError || !farmer) {
      return new Response(JSON.stringify({
        success: false,
        error: 'PROFILE_NOT_FOUND',
        message: 'OTP verified, but registered farmer profile could not be loaded.',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const farmerProfile = {
      id: farmer.farmer_id,
      name: farmer.name,
      phone: farmer.phone,
      state: farmer.state || 'Maharashtra',
      district: farmer.district || '',
      taluka: farmer.taluka || '',
      village: farmer.village || '',
      primaryCrop: farmer.primary_crop || 'Onion',
      landAreaAcres: Number(farmer.land_area_acres) || 0,
      expectedHarvestQuintals: Number(farmer.expected_harvest_quintals) || 0,
      preferredLanguage: farmer.preferred_language || 'mr',
      consentForAdvisory: farmer.consent_for_advisory !== false,
      registeredDate: farmer.registration_date || new Date().toISOString().split('T')[0],
      status: farmer.status,
    };

    return new Response(JSON.stringify({
      success: true,
      farmer: farmerProfile,
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
