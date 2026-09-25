-- ==============================================================================
-- Migration: 20260924000002_update_default_palette.sql
-- Description: Update default theme configuration to Farmer's Gamble color palette:
--   Primary: #388E3C (Fresh Green)
--   Secondary: #1976D2 (Sky Blue)
--   Accent: #F57C00 (Orange)
--   Accent Light: #C8E6C9 (Light Green)
--   Background: #FAFAFA (Off-White)
--   Surface: #FFFFFF (White)
--   Text Dark: #333333 (Dark Gray)
--   Text Muted: #666666 (Medium Gray)
--   Border: #E0E0E0 (Light Gray)
-- ==============================================================================

UPDATE public.app_cms_config
SET theme = jsonb_build_object(
    'primaryColor', '#388E3C',
    'secondaryColor', '#1976D2',
    'accentColor', '#F57C00',
    'accentLightColor', '#C8E6C9',
    'backgroundColor', '#FAFAFA',
    'surfaceColor', '#FFFFFF',
    'textDarkColor', '#333333',
    'textMutedColor', '#666666',
    'borderColor', '#E0E0E0',
    'textColor', '#333333',
    'mutedTextColor', '#666666',
    'successColor', '#388E3C',
    'warningColor', '#F57C00',
    'errorColor', '#D32F2F'
),
updated_at = now(),
updated_by = 'migration_theme_update'
WHERE id = 'current';
