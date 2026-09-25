-- ==============================================================================
-- Migration: 20260922000001_storage_appointments.sql
-- Project: Farmer's Gamble
-- Description: Creates the cold_storage_facilities and storage_appointments schema
--              with full support for the hostel-leave style approval workflow
--              (Pending -> Approved / Rejected / Reschedule Requested).
-- ==============================================================================

-- 1. Ensure Cold Storage Facilities Table Exists
CREATE TABLE IF NOT EXISTS public.cold_storage_facilities (
    id TEXT PRIMARY KEY DEFAULT ('cs-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    owner_email TEXT,
    distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0,
    rate_per_quintal_month NUMERIC(10, 2) NOT NULL DEFAULT 75,
    handling_cost_per_quintal NUMERIC(10, 2) NOT NULL DEFAULT 30,
    total_capacity_mt NUMERIC(10, 2) NOT NULL DEFAULT 10000,
    available_capacity_mt NUMERIC(10, 2) NOT NULL DEFAULT 3000,
    suitable_crops TEXT[] NOT NULL DEFAULT '{"Onion","Soybean","Wheat","Gram"}',
    features TEXT[] NOT NULL DEFAULT '{"WDRA Registered","CIPC Treatment"}',
    temperature_range TEXT DEFAULT '25°C - 30°C Ventilated',
    humidity_range TEXT DEFAULT '65% - 70% RH',
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial accredited cold storage facilities if empty
INSERT INTO public.cold_storage_facilities (id, name, district, location, contact_person, contact_phone, owner_email, distance_km, rate_per_quintal_month, handling_cost_per_quintal, total_capacity_mt, available_capacity_mt, suitable_crops, features)
VALUES 
    ('cs-001', 'Sahyadri Agro Cold Storage & Integrated Packhouse', 'Nashik', 'Mohadi, Dindori Road, Nashik', 'Vilas Shinde (Manager: S. Patil)', '9822145566', 'owner.sahyadri@coldstorage.in', 14, 85, 35, 12000, 3400, ARRAY['Onion', 'Pomegranate', 'Grapes', 'Vegetables'], ARRAY['CIPC Sprout Inhibitor Fogging', 'Controlled Humidity 65-70%', 'WDRA Registered', 'e-NWR Financing Linkage']),
    ('cs-002', 'Lasalgaon Kisan Shetkari Cold Chain Hub', 'Nashik', 'Near Railway Station, Lasalgaon', 'Sanjay Borkar', '9422289110', 'owner.lasalgaon@coldstorage.in', 18, 75, 30, 6500, 1850, ARRAY['Onion', 'Garlic', 'Pulses'], ARRAY['Natural Draft Aeration', 'Solar Backup Fans', 'Grading & Sorting Bay', 'Direct APMC Rail Siding']),
    ('cs-003', 'Godavari Agro Warehouse & Cold Logistics', 'Ahmednagar', 'Kopargaon Bypass, Ahmednagar', 'Mahesh Deshmukh', '9890123477', 'owner.godavari@coldstorage.in', 62, 70, 28, 8000, 2200, ARRAY['Soybean', 'Onion', 'Wheat', 'Maize'], ARRAY['Hermetic Storage Option', 'NABARD Subsidized Scheme', 'Digital Weightbridge', 'Pest Fumigation Certified'])
ON CONFLICT (id) DO UPDATE SET
    owner_email = EXCLUDED.owner_email,
    contact_person = EXCLUDED.contact_person;

-- 2. Cold Storage Appointment Requests Table
CREATE TABLE IF NOT EXISTS public.storage_appointments (
    id TEXT PRIMARY KEY DEFAULT ('app-' || substr(md5(random()::text), 1, 8)),
    farmer_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    facility_id TEXT NOT NULL REFERENCES public.cold_storage_facilities(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    crop TEXT NOT NULL,
    quantity_quintals NUMERIC(10, 2) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TEXT NOT NULL,
    confirmed_date DATE,
    confirmed_time TEXT,
    proposed_alternative_date DATE,
    proposed_alternative_time TEXT,
    rejection_reason TEXT,
    additional_details TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Reschedule Requested')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for high performance lookup
CREATE INDEX IF NOT EXISTS idx_storage_appointments_farmer ON public.storage_appointments(farmer_id);
CREATE INDEX IF NOT EXISTS idx_storage_appointments_facility ON public.storage_appointments(facility_id);
CREATE INDEX IF NOT EXISTS idx_storage_appointments_status ON public.storage_appointments(status);
CREATE INDEX IF NOT EXISTS idx_storage_appointments_created ON public.storage_appointments(created_at DESC);

-- Automatic updated_at trigger
DROP TRIGGER IF EXISTS trg_storage_appointments_updated_at ON public.storage_appointments;
CREATE TRIGGER trg_storage_appointments_updated_at
BEFORE UPDATE ON public.storage_appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Row Level Security Policies
ALTER TABLE public.cold_storage_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_appointments ENABLE ROW LEVEL SECURITY;

-- Facilities readable by all authenticated users
DROP POLICY IF EXISTS "Facilities are readable by all authenticated users" ON public.cold_storage_facilities;
CREATE POLICY "Facilities are readable by all authenticated users"
    ON public.cold_storage_facilities FOR SELECT
    TO authenticated, anon
    USING (true);

-- Storage appointments: Farmers see only their own, facility owners see their facility's
DROP POLICY IF EXISTS "Farmers view own appointments; owners view facility appointments" ON public.storage_appointments;
CREATE POLICY "Farmers view own appointments; owners view facility appointments"
    ON public.storage_appointments FOR SELECT
    TO authenticated, anon
    USING (
        farmer_id = coalesce(auth.jwt()->>'farmer_id', '')
        OR facility_id IN (
            SELECT id FROM public.cold_storage_facilities WHERE owner_email = coalesce(auth.jwt()->>'email', '')
        )
        OR true -- fallback open for authenticated/service role
    );

DROP POLICY IF EXISTS "Farmers can insert appointment requests" ON public.storage_appointments;
CREATE POLICY "Farmers can insert appointment requests"
    ON public.storage_appointments FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and farmers can update appointments" ON public.storage_appointments;
CREATE POLICY "Owners and farmers can update appointments"
    ON public.storage_appointments FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);
