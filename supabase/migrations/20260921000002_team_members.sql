-- ==============================================================================
-- Migration: 20260921000002_team_members.sql
-- Project: Farmer's Gamble
-- Description: Secure team_members table for team registration and management.
--
-- Security Rules Enforced:
--  1. Strictly Admin-Managed: Only authorized administrators can register, view,
--     update, deactivate, or reactivate team members.
--  2. Zero Self-Registration: Self-registration is strictly disallowed.
--  3. Duplicate Prevention: Unique constraints on phone numbers (including normalized digits).
--  4. Zero Mock/Sample Data: No placeholder rows inserted.
-- ==============================================================================

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
-- 1. TEAM MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'team_member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Basic sanity check: phone must contain at least 10 digits
    CONSTRAINT chk_team_members_valid_phone 
        CHECK (length(regexp_replace(phone_number, '\D', '', 'g')) >= 10)
);

-- ------------------------------------------------------------------------------
-- 2. PREVENT DUPLICATE PHONE NUMBERS (CROSS-FORMATTING)
-- Handles variations like +91 9822012345 vs 9822012345
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_members_normalized_phone
ON public.team_members (RIGHT(REGEXP_REPLACE(phone_number, '\D', '', 'g'), 10));

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR FAST LOOKUP
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON public.team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- ------------------------------------------------------------------------------
-- 4. AUTO-UPDATE TIMESTAMP TRIGGER
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. ADMIN VERIFICATION HELPER (SAFEGUARD IF RUN STANDALONE)
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

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Only authorized admin can register, view, update, deactivate, or reactivate.
-- Self-registration is completely blocked.
-- ------------------------------------------------------------------------------
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 6.1 View Team Members (Admin Only)
DROP POLICY IF EXISTS "Admins can view team members" ON public.team_members;
CREATE POLICY "Admins can view team members"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 6.2 Register Team Members (Admin Only - No self-registration)
DROP POLICY IF EXISTS "Admins can register team members" ON public.team_members;
CREATE POLICY "Admins can register team members"
    ON public.team_members FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- 6.3 Update, Deactivate, or Reactivate Team Members (Admin Only)
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
CREATE POLICY "Admins can update team members"
    ON public.team_members FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.4 Delete Team Members (Admin Only)
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
CREATE POLICY "Admins can delete team members"
    ON public.team_members FOR DELETE
    TO authenticated
    USING (public.is_admin());
