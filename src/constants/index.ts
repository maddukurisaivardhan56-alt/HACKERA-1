/**
 * Application Constants
 * Farmer's Gamble — AI-Assisted Agricultural Decision Intelligence
 */

export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    DEMO: '/demo',
  },
  FARMER: {
    ROOT: '/farmer',
    MANDIS: '/farmer/mandis',
    SELL_OR_STORE: '/farmer/sell-or-store',
    COLD_STORAGE: '/farmer/cold-storage',
    ADVISORIES: '/farmer/advisories',
  },
  ADMIN: {
    ROOT: '/admin',
    CALLING_DASHBOARD: '/admin/calling-dashboard',
    BULK_CALLING: '/admin/bulk-calling',
    FARMER_SUPPORT: '/admin/farmer-support',
    MARKET_INFO: '/admin/market-info',
    GOVERNMENT_SCHEMES: '/admin/government-schemes',
    FIELD_INSPECTIONS: '/admin/field-inspections',
  },
  STORAGE_OWNER: {
    ROOT: '/storage-owner',
  },
  DEVELOPER: {
    ROOT: '/developer',
    DASHBOARD: '/developer/dashboard',
  },
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'mr', label: 'मराठी', short: 'म' },
  { code: 'hi', label: 'हिंदी', short: 'हि' },
] as const;

export const APP_METADATA = {
  NAME: "Farmer's Gamble",
  TAGLINE: 'Smart Information. Stronger Farmers.',
  HELPLINE: '1800-180-1551',
  LOCATION: 'Krishi Bhavan, Shivaji Nagar, Pune - 411005',
} as const;
