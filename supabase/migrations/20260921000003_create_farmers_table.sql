-- ==============================================================================
-- Migration: 20260921000003_create_farmers_table.sql
-- Project: Farmer's Gamble
-- Description: Creates ONLY the existing 'farmers' table and its required foreign-key
--              dependencies (administrators, agriculture_officers), triggers, indexes,
--              and RLS policies.
--
-- Constraints Enforced:
--  1. Zero demo/farmer rows inserted.
--  2. Foreign keys preserved:
--     - farmers.assigned_officer_id -> agriculture_officers(officer_id)
--     - farmers.registered_by_admin_id -> administrators(admin_id)
--     - farmers.registered_by_officer_id -> agriculture_officers(officer_id)
--     - farmers.user_id -> auth.users(id)
--  3. Strict No Self-Registration RLS: only authorized staff can insert farmers.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & UTILITIES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. FOREIGN KEY DEPENDENCY TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Government Administrators Table (Required for registered_by_admin_id FK)
CREATE TABLE IF NOT EXISTS public.administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id TEXT UNIQUE NOT NULL,                          -- e.g. 'ADM-MH-001'
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    designation TEXT NOT NULL,                              -- e.g. 'Agricultural System Administrator'
    assigned_area TEXT NOT NULL DEFAULT 'Maharashtra State',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Agriculture Officers Table (Required for assigned_officer_id & registered_by_officer_id FKs)
CREATE TABLE IF NOT EXISTS public.agriculture_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    officer_id TEXT UNIQUE NOT NULL,                        -- e.g. 'AO-MH-NSK-1042'
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    designation TEXT NOT NULL,                              -- e.g. 'Taluka Agriculture Officer (TAO)'
    department TEXT NOT NULL DEFAULT 'Department of Agriculture, Govt. of Maharashtra',
    office_location TEXT,                                   -- e.g. 'Sub-Divisional Krishi Bhavan, Niphad'
    assigned_district TEXT NOT NULL,                        -- e.g. 'Nashik'
    assigned_taluka TEXT NOT NULL,                          -- e.g. 'Niphad'
    assigned_villages TEXT[] NOT NULL DEFAULT '{}',         -- e.g. ARRAY['Lasalgaon', 'Pimpalgaon', 'Ozar']
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. FARMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    farmer_id TEXT UNIQUE NOT NULL,                         -- e.g. 'FG-MH-001'
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,                            -- 10-digit registered mobile number
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    district TEXT NOT NULL,
    taluka TEXT NOT NULL,
    village TEXT NOT NULL,
    primary_crop TEXT,
    land_area_acres NUMERIC(6, 2) DEFAULT 0.0,
    expected_harvest_quintals NUMERIC(10, 2) DEFAULT 0.0,
    preferred_language TEXT NOT NULL DEFAULT 'mr' CHECK (preferred_language IN ('mr', 'hi', 'en', 'te')),
    consent_for_advisory BOOLEAN NOT NULL DEFAULT true,
    assigned_officer_id TEXT REFERENCES public.agriculture_officers(officer_id) ON DELETE SET NULL,
    registered_by_admin_id TEXT REFERENCES public.administrators(admin_id) ON DELETE SET NULL,
    registered_by_officer_id TEXT REFERENCES public.agriculture_officers(officer_id) ON DELETE SET NULL,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Verification', 'Inactive', 'Suspended')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_administrators_user_id ON public.administrators(user_id);
CREATE INDEX IF NOT EXISTS idx_administrators_email ON public.administrators(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_agriculture_officers_user_id ON public.agriculture_officers(user_id);
CREATE INDEX IF NOT EXISTS idx_agriculture_officers_email ON public.agriculture_officers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_agriculture_officers_district ON public.agriculture_officers(assigned_district, assigned_taluka);

CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON public.farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON public.farmers(phone);
CREATE INDEX IF NOT EXISTS idx_farmers_district_taluka ON public.farmers(district, taluka);
CREATE INDEX IF NOT EXISTS idx_farmers_assigned_officer ON public.farmers(assigned_officer_id);

-- ------------------------------------------------------------------------------
-- 5. TIMESTAMPS AUTO-UPDATE TRIGGERS
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_administrators_updated_at ON public.administrators;
CREATE TRIGGER trg_administrators_updated_at
BEFORE UPDATE ON public.administrators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_officers_updated_at ON public.agriculture_officers;
CREATE TRIGGER trg_officers_updated_at
BEFORE UPDATE ON public.agriculture_officers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_farmers_updated_at ON public.farmers;
CREATE TRIGGER trg_farmers_updated_at
BEFORE UPDATE ON public.farmers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. RBAC HELPER FUNCTIONS (FOR ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.administrators
        WHERE is_active = true
          AND (
              user_id = auth.uid()
              OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
          )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_officer()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.agriculture_officers
        WHERE is_active = true
          AND (
              user_id = auth.uid()
              OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
          )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT public.is_admin() OR public.is_officer();
$$;

CREATE OR REPLACE FUNCTION public.get_current_farmer_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_farmer_id TEXT;
    v_cleaned_phone TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    v_cleaned_phone := RIGHT(REGEXP_REPLACE(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g'), 10);

    SELECT farmer_id INTO v_farmer_id
    FROM public.farmers
    WHERE status = 'Active'
      AND (
          user_id = auth.uid()
          OR (v_cleaned_phone <> '' AND RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10) = v_cleaned_phone)
      )
    LIMIT 1;

    RETURN v_farmer_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. SUPABASE AUTH USER IDENTITY SYNC TRIGGER
-- Attaches auth.users(id) to pre-registered farmer record when farmer verifies mobile
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_auth_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
    v_phone TEXT;
BEGIN
    v_email := LOWER(COALESCE(NEW.email, ''));
    v_phone := RIGHT(REGEXP_REPLACE(COALESCE(NEW.phone, ''), '\D', '', 'g'), 10);

    IF v_email <> '' THEN
        UPDATE public.administrators
        SET user_id = NEW.id
        WHERE LOWER(email) = v_email AND (user_id IS NULL OR user_id = NEW.id);

        UPDATE public.agriculture_officers
        SET user_id = NEW.id
        WHERE LOWER(email) = v_email AND (user_id IS NULL OR user_id = NEW.id);
    END IF;

    IF v_phone <> '' THEN
        UPDATE public.farmers
        SET user_id = NEW.id
        WHERE RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10) = v_phone
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
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Farmers CANNOT self-register.
-- Registration is strictly restricted to authorized Administrators and Agriculture Officers.
-- ------------------------------------------------------------------------------
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agriculture_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

-- 8.1 Administrators RLS
DROP POLICY IF EXISTS "Admins can view all administrators" ON public.administrators;
CREATE POLICY "Admins can view all administrators"
    ON public.administrators FOR SELECT
    TO authenticated
    USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmins can insert administrators" ON public.administrators;
CREATE POLICY "Superadmins can insert administrators"
    ON public.administrators FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Superadmins can update administrators" ON public.administrators;
CREATE POLICY "Superadmins can update administrators"
    ON public.administrators FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.2 Agriculture Officers RLS
DROP POLICY IF EXISTS "Staff can view all officers; farmers can view their assigned officer" ON public.agriculture_officers;
CREATE POLICY "Staff can view all officers; farmers can view their assigned officer"
    ON public.agriculture_officers FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR officer_id = (SELECT assigned_officer_id FROM public.farmers WHERE farmer_id = public.get_current_farmer_id())
    );

DROP POLICY IF EXISTS "Admins can manage officers" ON public.agriculture_officers;
CREATE POLICY "Admins can manage officers"
    ON public.agriculture_officers FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.3 Farmers Table RLS
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

DROP POLICY IF EXISTS "Staff can view all farmers; farmer can view only their own record" ON public.farmers;
CREATE POLICY "Staff can view all farmers; farmer can view only their own record"
    ON public.farmers FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );
