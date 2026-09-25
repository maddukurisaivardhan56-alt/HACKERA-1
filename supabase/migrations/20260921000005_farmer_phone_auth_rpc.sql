-- ==============================================================================
-- Migration: 20260921000005_farmer_phone_auth_rpc.sql
-- Project: Farmer's Gamble
-- Description:
--   1. Strict canonical E.164 phone normalization function: public.normalize_phone(p_phone)
--      - Validates Indian mobile format (^[6-9]\d{9}$) with canonical +91 prefix.
--      - Avoids loose trailing-digit matching and prevents cross-number / cross-country collisions.
--   2. Hardened pre-login verification RPC: public.check_farmer_registered(p_phone)
--      - Returns strictly BOOLEAN (true/false) with zero personal data leakage.
--      - Prevents phone-number enumeration attacks via client IP rate-limiting (max 10 lookups / 5 min).
--      - SECURITY DEFINER with fixed search_path = public, pg_temp.
--      - Explicitly REVOKES execute from PUBLIC; grants to anon and authenticated only.
--   3. Hardened session identity helper: public.get_current_farmer_id()
--      - Primary link: cryptographically secure auth.uid() = public.farmers.user_id.
--      - Fallback: canonical E.164 verified phone claim in authenticated JWT.
--      - Strictly limits farmers to their own record.
--      - Permits both 'Active' and 'Pending Verification' farmers to log in via OTP without
--        claiming land ownership is verified.
--      - Explicitly REVOKES execute from PUBLIC; grants strictly to authenticated users only.
--   4. Hardened Auth sync trigger: public.handle_user_auth_sync()
--      - Syncs auth.users to public.farmers using canonical E.164 phone matching.
--      - Strict no self-registration: updates pre-existing staff-registered records only, NEVER inserts.
--   5. Refreshes SELECT policy on public.farmers to enforce isolation.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CANONICAL E.164 PHONE NORMALIZATION HELPER (IMMUTABLE, STRICT)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_trimmed TEXT;
    v_digits TEXT;
BEGIN
    IF p_phone IS NULL THEN
        RETURN NULL;
    END IF;

    v_trimmed := TRIM(p_phone);
    IF v_trimmed = '' THEN
        RETURN NULL;
    END IF;

    -- Strip all non-digit characters
    v_digits := REGEXP_REPLACE(v_trimmed, '\D', '', 'g');

    -- Case 1: Already has explicit '+' country code prefix (e.g. +917993013756)
    IF v_trimmed LIKE '+%' THEN
        IF LENGTH(v_digits) BETWEEN 10 AND 15 THEN
            RETURN '+' || v_digits;
        ELSE
            RETURN NULL;
        END IF;
    END IF;

    -- Case 2: 12 digits starting with 91 followed by valid Indian mobile prefix [6-9]
    IF LENGTH(v_digits) = 12 AND v_digits ~ '^91[6-9]\d{9}$' THEN
        RETURN '+' || v_digits;
    END IF;

    -- Case 3: 11 digits starting with trunk prefix '0' followed by Indian mobile [6-9]
    IF LENGTH(v_digits) = 11 AND v_digits ~ '^0[6-9]\d{9}$' THEN
        RETURN '+91' || SUBSTRING(v_digits FROM 2);
    END IF;

    -- Case 4: Standard 10-digit Indian mobile number starting with [6-9]
    IF LENGTH(v_digits) = 10 AND v_digits ~ '^[6-9]\d{9}$' THEN
        RETURN '+91' || v_digits;
    END IF;

    -- Case 5: Valid generic E.164 international length (11-15 digits)
    IF LENGTH(v_digits) BETWEEN 11 AND 15 THEN
        RETURN '+' || v_digits;
    END IF;

    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT) TO anon, authenticated;

-- Expression index for fast, index-accelerated normalized phone lookups
CREATE INDEX IF NOT EXISTS idx_farmers_normalized_phone
ON public.farmers (public.normalize_phone(phone));

-- ------------------------------------------------------------------------------
-- 2. ANTI-ENUMERATION RATE LIMITING TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_lookup_rate_limits (
    client_key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deny all public access to the rate-limits table directly; accessible only via SECURITY DEFINER
REVOKE ALL ON TABLE public.farmer_lookup_rate_limits FROM PUBLIC;
CREATE INDEX IF NOT EXISTS idx_lookup_rate_limits_window ON public.farmer_lookup_rate_limits(window_start);

-- ------------------------------------------------------------------------------
-- 3. HARDENED PRE-LOGIN RPC: check_farmer_registered(p_phone)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_farmer_registered(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_norm_phone TEXT;
    v_client_ip TEXT;
    v_recent_attempts INTEGER;
    v_window_start TIMESTAMPTZ;
    v_is_registered BOOLEAN := false;
BEGIN
    -- Step 1: Normalize phone to canonical E.164
    v_norm_phone := public.normalize_phone(p_phone);
    IF v_norm_phone IS NULL THEN
        RETURN false;
    END IF;

    -- Step 2: Extract real client IP from Supabase reverse-proxy headers
    BEGIN
        v_client_ip := COALESCE(
            NULLIF(current_setting('request.headers', true)::json->>'cf-connecting-ip', ''),
            NULLIF(current_setting('request.headers', true)::json->>'x-real-ip', ''),
            NULLIF(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
            inet_client_addr()::text,
            'anonymous_caller'
        );
        IF v_client_ip LIKE '%,%' THEN
            v_client_ip := TRIM(SPLIT_PART(v_client_ip, ',', 1));
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            v_client_ip := 'unknown_caller';
    END;

    -- Clean up stale rate-limit windows older than 15 minutes
    DELETE FROM public.farmer_lookup_rate_limits
    WHERE window_start < now() - INTERVAL '15 minutes';

    -- Check rate limit: maximum 10 lookup attempts per 5-minute rolling window per client
    SELECT attempts, window_start INTO v_recent_attempts, v_window_start
    FROM public.farmer_lookup_rate_limits
    WHERE client_key = v_client_ip;

    IF v_recent_attempts IS NOT NULL AND v_window_start >= now() - INTERVAL '5 minutes' THEN
        IF v_recent_attempts >= 10 THEN
            -- Rate limit exceeded: return false silently to prevent enumeration
            RETURN false;
        END IF;

        UPDATE public.farmer_lookup_rate_limits
        SET attempts = attempts + 1
        WHERE client_key = v_client_ip;
    ELSE
        INSERT INTO public.farmer_lookup_rate_limits (client_key, attempts, window_start)
        VALUES (v_client_ip, 1, now())
        ON CONFLICT (client_key) DO UPDATE
        SET attempts = 1, window_start = now();
    END IF;

    -- Step 3: Exact canonical E.164 lookup against registered farmers
    -- Eligible statuses: 'Active' and 'Pending Verification'
    SELECT EXISTS (
        SELECT 1
        FROM public.farmers
        WHERE public.normalize_phone(phone) = v_norm_phone
          AND status IN ('Active', 'Pending Verification')
    ) INTO v_is_registered;

    -- Return strictly a boolean. Zero personal data exposed.
    RETURN v_is_registered;
END;
$$;

-- Revoke all permissions from PUBLIC; grant only to anon and authenticated
REVOKE ALL ON FUNCTION public.check_farmer_registered(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_farmer_registered(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. HARDENED IDENTITY HELPER: get_current_farmer_id()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_farmer_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
    v_farmer_id TEXT;
    v_jwt_phone TEXT;
    v_norm_jwt_phone TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- 1. Primary, unambiguous link: match authenticated user's UUID directly
    SELECT farmer_id INTO v_farmer_id
    FROM public.farmers
    WHERE user_id = auth.uid()
      AND status IN ('Active', 'Pending Verification')
    LIMIT 1;

    IF v_farmer_id IS NOT NULL THEN
        RETURN v_farmer_id;
    END IF;

    -- 2. Fallback: match canonical E.164 verified phone claim in authenticated JWT
    v_jwt_phone := COALESCE(auth.jwt() ->> 'phone', '');
    v_norm_jwt_phone := public.normalize_phone(v_jwt_phone);

    IF v_norm_jwt_phone IS NOT NULL THEN
        SELECT farmer_id INTO v_farmer_id
        FROM public.farmers
        WHERE public.normalize_phone(phone) = v_norm_jwt_phone
          AND status IN ('Active', 'Pending Verification')
        LIMIT 1;
    END IF;

    RETURN v_farmer_id;
END;
$$;

-- Revoke all permissions from PUBLIC; grant strictly to authenticated users only
REVOKE ALL ON FUNCTION public.get_current_farmer_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_farmer_id() TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. HARDENED SUPABASE AUTH IDENTITY SYNC TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_auth_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_email TEXT;
    v_norm_phone TEXT;
BEGIN
    v_email := LOWER(COALESCE(NEW.email, ''));
    v_norm_phone := public.normalize_phone(NEW.phone);

    -- 1. Sync Administrator Profile
    IF v_email <> '' THEN
        UPDATE public.administrators
        SET user_id = NEW.id
        WHERE LOWER(email) = v_email AND (user_id IS NULL OR user_id = NEW.id);

        UPDATE public.agriculture_officers
        SET user_id = NEW.id
        WHERE LOWER(email) = v_email AND (user_id IS NULL OR user_id = NEW.id);
    END IF;

    -- 2. Sync Farmer Profile by canonical E.164 verified mobile
    -- Strict No Self-Registration: updates pre-registered records ONLY. Never inserts.
    IF v_norm_phone IS NOT NULL THEN
        UPDATE public.farmers
        SET user_id = NEW.id
        WHERE public.normalize_phone(phone) = v_norm_phone
          AND (user_id IS NULL OR user_id = NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_sync ON auth.users;
CREATE TRIGGER trg_auth_user_sync
AFTER INSERT OR UPDATE OF email, phone ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_auth_sync();

-- ------------------------------------------------------------------------------
-- 6. HARDENED RLS POLICIES ON FARMERS TABLE
-- Enforces strict record isolation: authenticated farmer views ONLY their own record.
-- ------------------------------------------------------------------------------
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all farmers; farmer can view only their own record" ON public.farmers;
CREATE POLICY "Staff can view all farmers; farmer can view only their own record"
    ON public.farmers FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR user_id = auth.uid()
        OR farmer_id = public.get_current_farmer_id()
    );

DROP POLICY IF EXISTS "Staff can register new farmers" ON public.farmers;
CREATE POLICY "Staff can register new farmers"
    ON public.farmers FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can update farmers" ON public.farmers;
CREATE POLICY "Staff can update farmers"
    ON public.farmers FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can delete or deactivate farmers" ON public.farmers;
CREATE POLICY "Staff can delete or deactivate farmers"
    ON public.farmers FOR DELETE
    TO authenticated
    USING (public.is_admin());
