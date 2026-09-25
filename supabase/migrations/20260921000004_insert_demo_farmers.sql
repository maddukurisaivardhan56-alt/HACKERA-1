-- ==============================================================================
-- Migration: 20260921000004_insert_demo_farmers.sql
-- Project: Farmer's Gamble
-- Description:
--   1. Updates preferred_language CHECK constraint on public.farmers to support 'te' (Telugu).
--   2. Inserts 6 demo farmers from local CSV with registration status 'Pending Verification'.
--
-- Rules Enforced:
--   - No team_members table interaction.
--   - Language 'TELUGU' mapped to ISO code 'te'.
--   - Status 'SINGLE' from CSV ignored; set to 'Pending Verification'.
--   - Exact names, phone numbers, location, crop, and land area preserved.
--   - Idempotent: ON CONFLICT (farmer_id) DO NOTHING prevents duplicate insertions.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: UPDATE PREFERRED_LANGUAGE CONSTRAINT TO SUPPORT TELUGU ('te')
-- Must be executed before inserting rows with preferred_language = 'te'
-- ------------------------------------------------------------------------------
ALTER TABLE public.farmers
    DROP CONSTRAINT IF EXISTS farmers_preferred_language_check;

ALTER TABLE public.farmers
    ADD CONSTRAINT farmers_preferred_language_check
    CHECK (preferred_language IN ('mr', 'hi', 'en', 'te'));

-- ------------------------------------------------------------------------------
-- STEP 2: INSERT 6 DEMO FARMER RECORDS
-- Status set to 'Pending Verification' (land ownership pending officer verification)
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
    preferred_language,
    status
) VALUES
(
    'FG-DEMO-001',
    'MADDUKURI SAI VARDHAN',
    '7993013756',
    'Andhara Pradesh',
    'krishna',
    'Vijayawada',
    'IBM',
    'ONION',
    100.00,
    'te',
    'Pending Verification'
),
(
    'FG-DEMO-002',
    'BORRA AKHILA',
    '9704316533',
    'Andhara Pradesh',
    'krishna',
    'Vijayawada',
    'IBM',
    'ONION',
    100.00,
    'te',
    'Pending Verification'
),
(
    'FG-DEMO-003',
    'BORRA ALEKHYA',
    '6303381553',
    'Andhara Pradesh',
    'krishna',
    'Vijayawada',
    'IBM',
    'ONION',
    100.00,
    'te',
    'Pending Verification'
),
(
    'FG-DEMO-004',
    'BUGGA PRATHIBA',
    '7396972396',
    'Andhara Pradesh',
    'krishna',
    'Vijayawada',
    'IBM',
    'ONION',
    100.00,
    'te',
    'Pending Verification'
),
(
    'FG-DEMO-005',
    'TRILEKHA',
    '8520888389',
    'Andhara Pradesh',
    'krishna',
    'Vijayawada',
    'IBM',
    'ONION',
    100.00,
    'te',
    'Pending Verification'
),
(
    'FG-DEMO-006',
    'NISCHAL',
    '8142068003',
    'Andhara Pradesh',
    'krishna',
    'Vijayawada',
    'IBM',
    'ONION',
    100.00,
    'te',
    'Pending Verification'
)
ON CONFLICT (farmer_id) DO NOTHING;
