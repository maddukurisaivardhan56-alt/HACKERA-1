-- ==============================================================================
-- Migration: 20260921000001_initial_schema.sql
-- Project: Farmer's Gamble
-- Description: Hardened production database schema supporting:
--              1. Government Administrators
--              2. Agriculture Officers
--              3. Pre-registered Farmers (Strict No Self-Registration)
--              4. Agricultural Operations (Mandi Prices, Cold Storage, Enquiries,
--                 Support Requests/Appointments, Field Inspections, AI Calling Journey,
--                 and Automated Advisories)
--
-- Security Rules Enforced:
--  - Zero self-registration for farmers; registration permitted exclusively by authorized staff.
--  - Authenticated users cannot access other users' private data.
--  - Farmers are strictly isolated to their own records via verified phone / auth identity.
--  - Zero mock users, demo phone numbers, or sample records inserted.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & UTILITIES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utility function to auto-update 'updated_at' timestamp
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
-- 2. CORE USER ROLE & PROFILE TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Government Administrators Table
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

-- 2.2 Agriculture Officers Table
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

-- 2.3 Farmers Table
-- Strictly registered by authorized staff only. Self-registration is disallowed.
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
    preferred_language TEXT NOT NULL DEFAULT 'mr' CHECK (preferred_language IN ('mr', 'hi', 'en')),
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
-- 3. CORE AGRICULTURAL ENTITIES
-- ------------------------------------------------------------------------------

-- 3.1 Mandi Price Records
CREATE TABLE IF NOT EXISTS public.mandi_prices (
    id TEXT PRIMARY KEY DEFAULT ('mp-' || substr(md5(random()::text), 1, 8)),
    commodity TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    min_price NUMERIC(10, 2) NOT NULL,
    max_price NUMERIC(10, 2) NOT NULL,
    modal_price NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'Quintal',
    distance_km NUMERIC(6, 2),
    arrival_quantity_quintals NUMERIC(10, 2) NOT NULL DEFAULT 0,
    variety TEXT,
    grade TEXT,
    source TEXT DEFAULT 'APMC Krishi Upaj Mandi',
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    price_trend_pct_7d NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 Cold Storage Facilities
CREATE TABLE IF NOT EXISTS public.cold_storage_facilities (
    id TEXT PRIMARY KEY DEFAULT ('cs-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0,
    rate_per_quintal_month NUMERIC(10, 2) NOT NULL,
    handling_cost_per_quintal NUMERIC(10, 2) NOT NULL,
    total_capacity_mt NUMERIC(10, 2) NOT NULL,
    available_capacity_mt NUMERIC(10, 2) NOT NULL,
    suitable_crops TEXT[] NOT NULL DEFAULT '{}',
    features TEXT[] NOT NULL DEFAULT '{}',
    temperature_range TEXT,
    humidity_range TEXT,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 Storage Enquiries
CREATE TABLE IF NOT EXISTS public.storage_enquiries (
    id TEXT PRIMARY KEY DEFAULT ('enq-' || substr(md5(random()::text), 1, 8)),
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    facility_id TEXT NOT NULL REFERENCES public.cold_storage_facilities(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    crop TEXT NOT NULL,
    quantity_quintals NUMERIC(10, 2) NOT NULL,
    requested_duration_months INTEGER NOT NULL DEFAULT 1,
    preferred_start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'in_review', 'facility_contacted', 'rejected', 'completed')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    is_simulated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. FIELD OPERATIONS: COMPLAINTS, APPOINTMENTS & INSPECTIONS
-- ------------------------------------------------------------------------------

-- 4.1 Farmer Support Requests / Complaints & Officer Appointments
CREATE TABLE IF NOT EXISTS public.farmer_support_requests (
    id TEXT PRIMARY KEY DEFAULT ('req-' || substr(md5(random()::text), 1, 8)),
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    taluka TEXT,
    district TEXT,
    crop TEXT NOT NULL,
    land_area_acres NUMERIC(6, 2),
    subject TEXT NOT NULL,
    issue_category TEXT NOT NULL CHECK (issue_category IN ('Pest & Disease', 'Nutrient Deficiency', 'Irrigation & Weather', 'Cultivation Practice', 'Market Guidance')),
    description TEXT NOT NULL,
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Resolved', 'Pending', 'Visit Scheduled', 'Visit Completed', 'In Progress')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    officer_guidance TEXT,
    assigned_officer_id TEXT REFERENCES public.agriculture_officers(officer_id) ON DELETE SET NULL,
    appointment_status TEXT CHECK (appointment_status IN ('Appointment Pending', 'Visit Scheduled', 'Visit Completed')),
    appointment_date DATE,
    appointment_time TEXT,
    visit_completed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 Field Inspection Records
CREATE TABLE IF NOT EXISTS public.field_inspections (
    id TEXT PRIMARY KEY DEFAULT ('ins-' || substr(md5(random()::text), 1, 8)),
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    taluka TEXT NOT NULL,
    district TEXT NOT NULL,
    crop TEXT NOT NULL,
    land_area_acres NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    crop_growth_stage TEXT NOT NULL,
    observed_health TEXT NOT NULL,
    reported_issues TEXT,
    officer_recommendations TEXT,
    officer_id TEXT REFERENCES public.agriculture_officers(officer_id) ON DELETE SET NULL,
    officer_name TEXT NOT NULL,
    follow_up_required BOOLEAN NOT NULL DEFAULT false,
    complaint_id TEXT REFERENCES public.farmer_support_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. AI CALLING JOURNEY & ADVISORIES
-- ------------------------------------------------------------------------------

-- 5.1 Farmer Calling Journey Records
CREATE TABLE IF NOT EXISTS public.farmer_calling_records (
    id TEXT PRIMARY KEY DEFAULT ('fcr-' || substr(md5(random()::text), 1, 8)),
    farmer_id TEXT UNIQUE NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    taluka TEXT NOT NULL,
    district TEXT NOT NULL,
    selected_crop TEXT NOT NULL,
    land_area_acres NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    consent_for_advisory BOOLEAN NOT NULL DEFAULT true,
    preferred_language TEXT NOT NULL DEFAULT 'mr',
    current_stage TEXT NOT NULL DEFAULT '1. Government Registration',
    call_status TEXT NOT NULL DEFAULT 'Not Started',
    last_call_date DATE,
    last_call_time TEXT,
    next_scheduled_call TEXT,
    collected_crop_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.2 Farmer Call Logs (Per-call audit history)
CREATE TABLE IF NOT EXISTS public.farmer_call_logs (
    id TEXT PRIMARY KEY DEFAULT ('cl-' || substr(md5(random()::text), 1, 8)),
    calling_record_id TEXT NOT NULL REFERENCES public.farmer_calling_records(id) ON DELETE CASCADE,
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    call_sid TEXT,
    stage TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_seconds INTEGER DEFAULT 0,
    summary TEXT NOT NULL,
    collected_crop_info JSONB DEFAULT '{}'::jsonb,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.3 Actionable Advisory Records
CREATE TABLE IF NOT EXISTS public.advisory_records (
    id TEXT PRIMARY KEY DEFAULT ('adv-' || substr(md5(random()::text), 1, 8)),
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    crop TEXT NOT NULL,
    market_name TEXT,
    trigger_event TEXT,
    advisory_type TEXT NOT NULL CHECK (advisory_type IN ('PRICE_SPIKE', 'INTER_MANDI_ARBITRAGE', 'STORAGE_FAVORABLE', 'HARVEST_ALERT')),
    headline TEXT NOT NULL,
    message_marathi TEXT,
    message_hindi TEXT,
    message_english TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    call_status TEXT NOT NULL DEFAULT 'scheduled',
    call_duration_seconds INTEGER DEFAULT 0,
    audio_simulated_url TEXT,
    key_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
    conversation JSONB DEFAULT '[]'::jsonb,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.4 Event Detection Rules (Triggers for automated market alerts)
CREATE TABLE IF NOT EXISTS public.event_detection_rules (
    id TEXT PRIMARY KEY DEFAULT ('evr-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    commodity TEXT NOT NULL,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('PRICE_DROP_STORAGE', 'MANDI_SPREAD_ALERT', 'BREAK_EVEN_CROSS', 'STORAGE_RATE_DROP')),
    threshold_value NUMERIC(10, 2) NOT NULL,
    threshold_unit TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    times_triggered INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. INDEXES
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

CREATE INDEX IF NOT EXISTS idx_mandi_prices_commodity_market ON public.mandi_prices(commodity, market);
CREATE INDEX IF NOT EXISTS idx_mandi_prices_reported_date ON public.mandi_prices(reported_date DESC);

CREATE INDEX IF NOT EXISTS idx_storage_enquiries_farmer ON public.storage_enquiries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_storage_enquiries_facility ON public.storage_enquiries(facility_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_farmer ON public.farmer_support_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.farmer_support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_officer ON public.farmer_support_requests(assigned_officer_id);

CREATE INDEX IF NOT EXISTS idx_calling_records_farmer ON public.farmer_calling_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_calling_records_stage ON public.farmer_calling_records(current_stage);
CREATE INDEX IF NOT EXISTS idx_call_logs_calling_record ON public.farmer_call_logs(calling_record_id);

CREATE INDEX IF NOT EXISTS idx_advisories_farmer ON public.advisory_records(farmer_id);

-- ------------------------------------------------------------------------------
-- 7. TIMESTAMPS TRIGGERS
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

DROP TRIGGER IF EXISTS trg_mandi_prices_updated_at ON public.mandi_prices;
CREATE TRIGGER trg_mandi_prices_updated_at
BEFORE UPDATE ON public.mandi_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_cold_storage_updated_at ON public.cold_storage_facilities;
CREATE TRIGGER trg_cold_storage_updated_at
BEFORE UPDATE ON public.cold_storage_facilities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_storage_enquiries_updated_at ON public.storage_enquiries;
CREATE TRIGGER trg_storage_enquiries_updated_at
BEFORE UPDATE ON public.storage_enquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_support_requests_updated_at ON public.farmer_support_requests;
CREATE TRIGGER trg_support_requests_updated_at
BEFORE UPDATE ON public.farmer_support_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_calling_records_updated_at ON public.farmer_calling_records;
CREATE TRIGGER trg_calling_records_updated_at
BEFORE UPDATE ON public.farmer_calling_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_event_rules_updated_at ON public.event_detection_rules;
CREATE TRIGGER trg_event_rules_updated_at
BEFORE UPDATE ON public.event_detection_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 8. SECURITY & ROLE-BASED ACCESS CONTROL (RBAC) FUNCTIONS
-- ------------------------------------------------------------------------------

-- Helper: Verify if current caller is an active Government Administrator
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

-- Helper: Verify if current caller is an active Agriculture Officer
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

-- Helper: Combined staff check
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT public.is_admin() OR public.is_officer();
$$;

-- Helper: Retrieve verified farmer_id of currently authenticated farmer
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

    -- Extract raw phone from JWT claim and trim to standard 10-digit number
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
-- 9. AUTOMATIC SUPABASE AUTH IDENTITY SYNC TRIGGER
-- Automatically attaches auth.users(id) to pre-provisioned Admins, Officers, and Farmers
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

    -- 1. Sync Administrator Profile
    IF v_email <> '' THEN
        UPDATE public.administrators
        SET user_id = NEW.id
        WHERE LOWER(email) = v_email AND (user_id IS NULL OR user_id = NEW.id);

        -- 2. Sync Agriculture Officer Profile
        UPDATE public.agriculture_officers
        SET user_id = NEW.id
        WHERE LOWER(email) = v_email AND (user_id IS NULL OR user_id = NEW.id);
    END IF;

    -- 3. Sync Farmer Profile by verified mobile
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
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Authenticated role alone does NOT grant universal access.
-- ------------------------------------------------------------------------------

ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agriculture_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandi_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cold_storage_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_calling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_detection_rules ENABLE ROW LEVEL SECURITY;

-- 10.1 Administrators Table
CREATE POLICY "Admins can view all administrators"
    ON public.administrators FOR SELECT
    TO authenticated
    USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Superadmins can insert administrators"
    ON public.administrators FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Superadmins can update administrators"
    ON public.administrators FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.2 Agriculture Officers Table
CREATE POLICY "Staff can view all officers; farmers can view their assigned officer"
    ON public.agriculture_officers FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR officer_id = (SELECT assigned_officer_id FROM public.farmers WHERE farmer_id = public.get_current_farmer_id())
    );

CREATE POLICY "Admins can manage officers"
    ON public.agriculture_officers FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.3 Farmers Table
-- RULE: Farmers CANNOT self-register.
-- Registration is strictly restricted to authorized Administrators and Agriculture Officers.
CREATE POLICY "Staff can register new farmers"
    ON public.farmers FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "Staff can update farmers"
    ON public.farmers FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

CREATE POLICY "Staff can delete or deactivate farmers"
    ON public.farmers FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- RULE: Farmers can ONLY read their own record after verified authentication.
CREATE POLICY "Staff can view all farmers; farmer can view only their own record"
    ON public.farmers FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

-- 10.4 Mandi Prices Table (Reference data)
CREATE POLICY "Public read access to mandi prices"
    ON public.mandi_prices FOR SELECT
    USING (true);

CREATE POLICY "Staff can insert mandi prices"
    ON public.mandi_prices FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "Staff can update mandi prices"
    ON public.mandi_prices FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.5 Cold Storage Facilities Table (Reference data)
CREATE POLICY "Public read access to cold storage facilities"
    ON public.cold_storage_facilities FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage cold storage facilities"
    ON public.cold_storage_facilities FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.6 Storage Enquiries Table
-- Isolated to staff or the specific enquiring farmer
CREATE POLICY "Staff can view all enquiries; farmers view only their own"
    ON public.storage_enquiries FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Farmers can submit enquiries for themselves; staff for farmers"
    ON public.storage_enquiries FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Staff can update enquiry statuses"
    ON public.storage_enquiries FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.7 Farmer Support Requests / Complaints & Appointments Table
CREATE POLICY "Staff can view all support requests; farmers view only their own"
    ON public.farmer_support_requests FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Farmers can create support requests for themselves; staff for farmers"
    ON public.farmer_support_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Staff can update guidance and appointments"
    ON public.farmer_support_requests FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.8 Field Inspections Table
CREATE POLICY "Staff can view all inspections; farmers view only their own farm inspections"
    ON public.field_inspections FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Officers and admins can create and update inspections"
    ON public.field_inspections FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.9 AI Calling Journey & Logs Table
CREATE POLICY "Staff can view all calling records; farmer views only their own"
    ON public.farmer_calling_records FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Staff can manage calling records"
    ON public.farmer_calling_records FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

CREATE POLICY "Staff can view all call logs; farmer views only their own"
    ON public.farmer_call_logs FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Staff can manage call logs"
    ON public.farmer_call_logs FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.10 Advisory Records Table
CREATE POLICY "Staff can view all advisories; farmer views only their own"
    ON public.advisory_records FOR SELECT
    TO authenticated
    USING (
        public.is_staff()
        OR farmer_id = public.get_current_farmer_id()
    );

CREATE POLICY "Staff can insert and manage advisories"
    ON public.advisory_records FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 10.11 Event Detection Rules Table
CREATE POLICY "Staff can view and manage event detection rules"
    ON public.event_detection_rules FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());
