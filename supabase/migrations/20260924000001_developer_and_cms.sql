-- ==============================================================================
-- Migration: 20260924000001_developer_and_cms.sql
-- Project: Farmer's Gamble
-- Description: Secure Developer Portal & Content Management System (CMS) Schema
--
-- Security Rules Enforced:
--  1. Developer Authorization: Role-based access control for Developer role.
--  2. Zero Public Leakage: Public users can read only safe CMS presentation config.
--  3. Immutable Audit Trails: Developer modifications logged with safe metadata.
--  4. Zero Secret Exposure: Passwords, tokens, and service keys are never stored here.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. DEVELOPER USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.developer_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    developer_id TEXT UNIQUE NOT NULL,                       -- e.g. 'DEV-001'
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'developer' CHECK (role = 'developer'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_developer_users_email ON public.developer_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_developer_users_is_active ON public.developer_users(is_active);

-- ------------------------------------------------------------------------------
-- 2. DEVELOPER VERIFICATION HELPER (RLS / FUNCTION)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_developer()
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
        SELECT 1 FROM public.developer_users
        WHERE is_active = true
          AND (
              user_id = auth.uid()
              OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
          )
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. APP CMS CONFIG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_cms_config (
    id TEXT PRIMARY KEY DEFAULT 'current',
    branding JSONB NOT NULL DEFAULT '{}'::jsonb,
    theme JSONB NOT NULL DEFAULT '{}'::jsonb,
    landing JSONB NOT NULL DEFAULT '{}'::jsonb,
    login JSONB NOT NULL DEFAULT '{}'::jsonb,
    navigation JSONB NOT NULL DEFAULT '{}'::jsonb,
    footer JSONB NOT NULL DEFAULT '{}'::jsonb,
    system JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT NOT NULL DEFAULT 'system'
);

-- Trigger to auto-update 'updated_at'
DROP TRIGGER IF EXISTS trg_app_cms_config_updated_at ON public.app_cms_config;
CREATE TRIGGER trg_app_cms_config_updated_at
BEFORE UPDATE ON public.app_cms_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. CMS AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id TEXT NOT NULL,
    developer_email TEXT NOT NULL,
    action TEXT NOT NULL,                                    -- e.g. 'THEME_UPDATED', 'BRANDING_UPDATED'
    resource TEXT NOT NULL,                                  -- e.g. 'cms/theme', 'cms/branding'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,              -- Safe metadata only; never tokens or secrets
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_audit_logs_created_at ON public.cms_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_audit_logs_action ON public.cms_audit_logs(action);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- 5.1 developer_users RLS
ALTER TABLE public.developer_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view developer users" ON public.developer_users;
CREATE POLICY "Developers can view developer users"
    ON public.developer_users FOR SELECT
    TO authenticated
    USING (public.is_developer());

DROP POLICY IF EXISTS "Developers can update developer users" ON public.developer_users;
CREATE POLICY "Developers can update developer users"
    ON public.developer_users FOR UPDATE
    TO authenticated
    USING (public.is_developer())
    WITH CHECK (public.is_developer());

-- 5.2 app_cms_config RLS
ALTER TABLE public.app_cms_config ENABLE ROW LEVEL SECURITY;

-- Public read access so landing page, login page, and portals can consume branding and theme
DROP POLICY IF EXISTS "Public can view active CMS config" ON public.app_cms_config;
CREATE POLICY "Public can view active CMS config"
    ON public.app_cms_config FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only verified developers can modify or insert CMS configuration
DROP POLICY IF EXISTS "Developers can insert CMS config" ON public.app_cms_config;
CREATE POLICY "Developers can insert CMS config"
    ON public.app_cms_config FOR INSERT
    TO authenticated
    WITH CHECK (public.is_developer());

DROP POLICY IF EXISTS "Developers can update CMS config" ON public.app_cms_config;
CREATE POLICY "Developers can update CMS config"
    ON public.app_cms_config FOR UPDATE
    TO authenticated
    USING (public.is_developer())
    WITH CHECK (public.is_developer());

-- 5.3 cms_audit_logs RLS
ALTER TABLE public.cms_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view audit logs" ON public.cms_audit_logs;
CREATE POLICY "Developers can view audit logs"
    ON public.cms_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_developer());

DROP POLICY IF EXISTS "Developers can insert audit logs" ON public.cms_audit_logs;
CREATE POLICY "Developers can insert audit logs"
    ON public.cms_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_developer());

-- ------------------------------------------------------------------------------
-- 6. SEED INITIAL DEVELOPER AND CMS CONFIGURATION
-- ------------------------------------------------------------------------------
INSERT INTO public.developer_users (developer_id, email, full_name, role, is_active)
VALUES (
    'DEV-001',
    'developer@hackara.in',
    'Hackara Systems Lead Developer',
    'developer',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.app_cms_config (
    id,
    branding,
    theme,
    landing,
    login,
    navigation,
    footer,
    system,
    updated_by
)
VALUES (
    'current',
    '{
        "appName": "Farmer''s Gamble",
        "tagline": "Smart Information. Stronger Farmers.",
        "logoUrl": "/favicon.svg",
        "faviconUrl": "/favicon.svg",
        "primaryLogoUrl": "/favicon.svg",
        "secondaryLogoUrl": "/favicon.svg"
    }'::jsonb,
    '{
        "primaryColor": "#16A34A",
        "secondaryColor": "#14532D",
        "accentColor": "#F59E0B",
        "backgroundColor": "#F8E7C9",
        "surfaceColor": "#FFFDF7",
        "textColor": "#064E3B",
        "mutedTextColor": "#6B7280",
        "successColor": "#10B981",
        "warningColor": "#F59E0B",
        "errorColor": "#EF4444",
        "borderColor": "#E0C79B"
    }'::jsonb,
    '{
        "heroHeading": "Precision Agriculture & Strategic Crop Market Decisions",
        "heroDescription": "Empowering farmers across Maharashtra with data-driven advisory: Real-time Mandi price comparison, scientific sell-or-store guidance, and integrated cold storage logistics.",
        "primaryCtaLabel": "Access Farmer Portal",
        "secondaryCtaLabel": "View Market Intelligence",
        "featureSectionHeading": "Engineered for Agricultural Prosperity",
        "featureSectionSubheading": "High-impact tools built specifically for peri-urban and rural farming communities.",
        "features": [],
        "statistics": [],
        "footerNotice": "Official Government Agricultural Decision Support System. Developed under SIH 2024–2026."
    }'::jsonb,
    '{
        "appName": "Farmer''s Gamble",
        "welcomeHeading": "Welcome to Kisan Advisory Portal",
        "welcomeSubtitle": "Secure agricultural intelligence platform for farmers, officers, and warehouse operators.",
        "farmerTabLabel": "Farmer Login",
        "farmerDescription": "Sign in with registered mobile number via fast two-factor verification OTP.",
        "adminTabLabel": "System Admin",
        "adminDescription": "Access central agricultural administration, telemetry, and bulk calling system.",
        "officerTabLabel": "Agriculture Officer",
        "officerDescription": "Field verification, advisory approvals, and localized farmer grievance handling.",
        "storageOwnerTabLabel": "Cold Storage Owner",
        "storageOwnerDescription": "Manage facility appointments, space inventory, and crop inbound schedules.",
        "signInButtonLabel": "Sign In Securely",
        "demoButtonLabel": "Explore Demo"
    }'::jsonb,
    '{
        "farmerNav": [],
        "adminNav": [],
        "storageOwnerNav": []
    }'::jsonb,
    '{
        "description": "Farmer’s Gamble is a next-generation agricultural decision support system designed to minimize distress sales and empower Indian farmers through market transparency.",
        "copyrightText": "© 2026 Farmer’s Gamble. Ministry of Agriculture & Farmers Welfare collaboration. All rights reserved.",
        "helplinePhone": "1800-180-1551 (Kisan Call Centre)",
        "supportEmail": "support@farmersgamble.gov.in",
        "officeAddress": "Krishi Bhavan, Shivaji Nagar, Pune - 411005, Maharashtra, India",
        "links": []
    }'::jsonb,
    '{
        "maintenanceMode": false,
        "maintenanceMessage": "System is undergoing scheduled maintenance.",
        "allowNewRegistrations": true,
        "advisoryAlertsActive": true,
        "enableLiveMarketFeed": true,
        "demoModeActive": true
    }'::jsonb,
    'migration_seed'
)
ON CONFLICT (id) DO NOTHING;
