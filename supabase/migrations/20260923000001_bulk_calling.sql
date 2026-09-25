-- ==============================================================================
-- Migration: 20260923000001_bulk_calling.sql
-- Project: Farmer's Gamble
-- Description:
--   1. Enhances farmer_call_logs with batch_id, call_purpose, and initiated_by.
--   2. Creates bulk_call_batches table for audit history of mass calls.
--   3. Adds performance indexes for call_sid and cooldown checks.
--   4. Configures RLS policies for administrator and agriculture officer access.
--   5. Seeds active verified farmers with explicit advisory consent.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENHANCE FARMER_CALL_LOGS TABLE
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'farmer_call_logs' 
          AND column_name = 'call_purpose'
    ) THEN
        ALTER TABLE public.farmer_call_logs 
        ADD COLUMN call_purpose TEXT DEFAULT 'Routine AI Advisory';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'farmer_call_logs' 
          AND column_name = 'batch_id'
    ) THEN
        ALTER TABLE public.farmer_call_logs 
        ADD COLUMN batch_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'farmer_call_logs' 
          AND column_name = 'initiated_by'
    ) THEN
        ALTER TABLE public.farmer_call_logs 
        ADD COLUMN initiated_by TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CREATE BULK_CALL_BATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulk_call_batches (
    id TEXT PRIMARY KEY DEFAULT ('batch-' || substr(md5(random()::text), 1, 8)),
    admin_id TEXT NOT NULL,
    call_purpose TEXT NOT NULL DEFAULT 'Routine AI Advisory',
    total_selected INTEGER NOT NULL DEFAULT 0,
    total_eligible INTEGER NOT NULL DEFAULT 0,
    queued_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'Partial Failure', 'Failed')),
    results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE & FAST LOOKUP
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid 
ON public.farmer_call_logs(call_sid);

CREATE INDEX IF NOT EXISTS idx_call_logs_farmer_time 
ON public.farmer_call_logs(farmer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_batch_id 
ON public.farmer_call_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_bulk_batches_admin 
ON public.bulk_call_batches(admin_id);

CREATE INDEX IF NOT EXISTS idx_bulk_batches_created 
ON public.bulk_call_batches(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.bulk_call_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all bulk call batches" ON public.bulk_call_batches;
CREATE POLICY "Staff can view all bulk call batches"
    ON public.bulk_call_batches FOR SELECT
    TO authenticated
    USING (public.is_staff());

DROP POLICY IF EXISTS "Staff can create bulk call batches" ON public.bulk_call_batches;
CREATE POLICY "Staff can create bulk call batches"
    ON public.bulk_call_batches FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can update bulk call batches" ON public.bulk_call_batches;
CREATE POLICY "Staff can update bulk call batches"
    ON public.bulk_call_batches FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- 5. SEED VERIFIED ACTIVE FARMERS WITH ADVISORY CONSENT
-- Ensures both Active (eligible) and Pending/Inactive farmers exist for validation.
-- ------------------------------------------------------------------------------
INSERT INTO public.farmers (
    farmer_id,
    name,
    phone,
    state,
    district,
    taluka,
    village,
    primary_crop,
    land_area_acres,
    expected_harvest_quintals,
    preferred_language,
    consent_for_advisory,
    status
) VALUES
(
    'FG-MH-001',
    'Ramesh Patil',
    '9822012345',
    'Maharashtra',
    'Nashik',
    'Niphad',
    'Pimpalgaon',
    'Onion',
    2.50,
    180.00,
    'mr',
    true,
    'Active'
),
(
    'FG-MH-002',
    'Suresh Jagtap',
    '9822023456',
    'Maharashtra',
    'Nashik',
    'Niphad',
    'Lasalgaon',
    'Onion',
    3.00,
    220.00,
    'mr',
    true,
    'Active'
),
(
    'FG-MH-003',
    'Nitin Shinde',
    '9822034567',
    'Maharashtra',
    'Nashik',
    'Niphad',
    'Ozar',
    'Tomato',
    1.50,
    95.00,
    'hi',
    true,
    'Active'
),
(
    'FG-MH-004',
    'Babasaheb Gite',
    '9822045678',
    'Maharashtra',
    'Nashik',
    'Niphad',
    'Chandori',
    'Grapes',
    4.00,
    260.00,
    'mr',
    true,
    'Active'
),
(
    'FG-MH-005',
    'Dnyaneshwar Khairnar',
    '9822056789',
    'Maharashtra',
    'Nashik',
    'Niphad',
    'Niphad Rural',
    'Wheat',
    2.00,
    80.00,
    'mr',
    false, -- No consent for advisory (Ineligible control)
    'Active'
),
(
    'FG-MH-006',
    'Sunita Wagh',
    '9822067890',
    'Maharashtra',
    'Nashik',
    'Niphad',
    'Pimpalgaon',
    'Soybean',
    1.80,
    65.00,
    'mr',
    true,
    'Suspended' -- Inactive/Suspended (Ineligible control)
)
ON CONFLICT (farmer_id) DO UPDATE SET
    status = EXCLUDED.status,
    consent_for_advisory = EXCLUDED.consent_for_advisory,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;

-- Ensure calling records exist for registered farmers
INSERT INTO public.farmer_calling_records (
    id,
    farmer_id,
    farmer_name,
    phone,
    village,
    taluka,
    district,
    selected_crop,
    land_area_acres,
    consent_for_advisory,
    preferred_language,
    current_stage,
    call_status
) VALUES
('fcr-001', 'FG-MH-001', 'Ramesh Patil', '9822012345', 'Pimpalgaon', 'Niphad', 'Nashik', 'Onion', 2.50, true, 'mr', '5. Market Price Updates', 'Completed'),
('fcr-002', 'FG-MH-002', 'Suresh Jagtap', '9822023456', 'Lasalgaon', 'Niphad', 'Nashik', 'Onion', 3.00, true, 'mr', '4. Weather Updates', 'Completed'),
('fcr-003', 'FG-MH-003', 'Nitin Shinde', '9822034567', 'Ozar', 'Niphad', 'Nashik', 'Tomato', 1.50, true, 'hi', '3. Farmer & Crop Interaction', 'Scheduled'),
('fcr-004', 'FG-MH-004', 'Babasaheb Gite', '9822045678', 'Chandori', 'Niphad', 'Nashik', 'Grapes', 4.00, true, 'mr', '2. Initial AI Call', 'Not Started'),
('fcr-005', 'FG-MH-005', 'Dnyaneshwar Khairnar', '9822056789', 'Niphad Rural', 'Niphad', 'Nashik', 'Wheat', 2.00, false, 'mr', '1. Government Registration', 'Not Started'),
('fcr-006', 'FG-MH-006', 'Sunita Wagh', '9822067890', 'Pimpalgaon', 'Niphad', 'Nashik', 'Soybean', 1.80, true, 'mr', '1. Government Registration', 'Not Started')
ON CONFLICT (farmer_id) DO NOTHING;
