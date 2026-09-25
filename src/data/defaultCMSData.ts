import { AppCMSConfig, CMSThemeConfig } from '../types';

export const DEFAULT_THEME_CONFIG: CMSThemeConfig = {
  primaryColor: '#388E3C',       // Fresh Green: Navbar, primary buttons, main headings, active states
  secondaryColor: '#1976D2',     // Sky Blue: Information sections, links, secondary buttons, informational elements
  accentColor: '#F57C00',        // Orange: Alerts, urgent advisories, "Call Now" buttons, price-drop warnings, important actions
  accentLightColor: '#C8E6C9',   // Light Green: Success cards, positive badges, "Store Recommended" banners, positive information areas
  backgroundColor: '#FAFAFA',    // Off-White: Main page background
  surfaceColor: '#FFFFFF',       // White: Cards, panels, modals, tables
  textDarkColor: '#333333',      // Dark Gray: Body text, primary headings
  textMutedColor: '#666666',     // Medium Gray: Labels, secondary text, timestamps
  borderColor: '#E0E0E0',        // Light Gray: Card borders, input fields, dividers

  // Compatibility aliases
  textColor: '#333333',
  mutedTextColor: '#666666',
  successColor: '#388E3C',
  warningColor: '#F57C00',
  errorColor: '#D32F2F',
};

export const DEFAULT_CMS_CONFIG: AppCMSConfig = {
  branding: {
    appName: "Farmer's Gamble",
    tagline: 'Smart Information. Stronger Farmers.',
    logoUrl: '/branding-symbol.png',
    faviconUrl: '/branding-symbol.png',
    primaryLogoUrl: '/branding-symbol.png',
    secondaryLogoUrl: '/branding-symbol.png',
  },
  theme: { ...DEFAULT_THEME_CONFIG },
  landing: {
    heroHeading: 'Precision Agriculture & Strategic Crop Market Decisions',
    heroDescription:
      'Empowering farmers across Maharashtra with data-driven advisory: Real-time Mandi price comparison, scientific sell-or-store guidance, and integrated cold storage logistics.',
    primaryCtaLabel: 'Access Farmer Portal',
    secondaryCtaLabel: 'View Market Intelligence',
    featureSectionHeading: 'Engineered for Agricultural Prosperity',
    featureSectionSubheading: 'High-impact tools built specifically for peri-urban and rural farming communities.',
    features: [
      {
        id: 'feat-1',
        title: 'Mandi Comparison Matrix',
        description:
          'Compare net realizations across regional APMC mandis including transport cost deductions to maximize profit.',
        iconName: 'TrendingUp',
      },
      {
        id: 'feat-2',
        title: 'Sell vs. Store Recommendation',
        description:
          'Algorithmic decision tree weighing warehousing fees, storage degradation, and price forecasts.',
        iconName: 'Scale',
      },
      {
        id: 'feat-3',
        title: 'Verified Cold Storage Hubs',
        description:
          'Real-time space availability, temperature controls, and instant digital booking at licensed facilities.',
        iconName: 'Warehouse',
      },
      {
        id: 'feat-4',
        title: 'Automated Voice Advisory',
        description:
          'Proactive vernacular voice calls delivering timely market and weather advisories directly to farmers.',
        iconName: 'PhoneCall',
      },
    ],
    statistics: [
      { id: 'stat-1', label: 'Registered Farmers', value: '5,000', suffix: '+' },
      { id: 'stat-2', label: 'APMC Mandis Covered', value: '42', suffix: '' },
      { id: 'stat-3', label: 'Average Profit Increase', value: '18.4', suffix: '%' },
      { id: 'stat-4', label: 'Cold Storages Connected', value: '16', suffix: '' },
    ],
    footerNotice: 'Official Government Agricultural Decision Support System. Developed under SIH 2024–2026.',
    newsItems: [
      '🌾 Mandi prices updated across Maharashtra APMCs',
      '📢 New farmer advisory available',
      '🏪 Cold storage appointment slots available',
      '🌦️ Weather advisory updated for selected regions',
      '📞 Farmer AI calling schedule updated',
    ],
  },
  login: {
    appName: "Farmer's Gamble",
    welcomeHeading: 'Welcome to Kisan Advisory Portal',
    welcomeSubtitle: 'Secure agricultural intelligence platform for farmers, officers, and warehouse operators.',
    farmerTabLabel: 'Farmer Login',
    farmerDescription: 'Sign in with registered mobile number via fast two-factor verification OTP.',
    adminTabLabel: 'System Admin',
    adminDescription: 'Access central agricultural administration, telemetry, and bulk calling system.',
    officerTabLabel: 'Agriculture Officer',
    officerDescription: 'Field verification, advisory approvals, and localized farmer grievance handling.',
    storageOwnerTabLabel: 'Cold Storage Owner',
    storageOwnerDescription: 'Manage facility appointments, space inventory, and crop inbound schedules.',
    signInButtonLabel: 'Sign In Securely',
    demoButtonLabel: 'Explore Demo',
  },
  navigation: {
    farmerNav: [
      { id: 'fn-1', label: 'Dashboard', path: '/farmer', isVisible: true, order: 1 },
      { id: 'fn-2', label: 'Mandi Prices', path: '/farmer/mandis', isVisible: true, order: 2 },
      { id: 'fn-3', label: 'Sell or Store', path: '/farmer/sell-or-store', isVisible: true, order: 3 },
      { id: 'fn-4', label: 'Cold Storage', path: '/farmer/cold-storage', isVisible: true, order: 4 },
      { id: 'fn-5', label: 'Advisories', path: '/farmer/advisories', isVisible: true, order: 5 },
    ],
    adminNav: [
      { id: 'an-1', label: 'Calling Dashboard', path: '/admin/calling-dashboard', isVisible: true, order: 1 },
      { id: 'an-2', label: 'Bulk Calling', path: '/admin/bulk-calling', isVisible: true, order: 2 },
      { id: 'an-3', label: 'Farmer Support', path: '/admin/farmer-support', isVisible: true, order: 3 },
      { id: 'an-4', label: 'Market Info', path: '/admin/market-info', isVisible: true, order: 4 },
      { id: 'an-5', label: 'Government Schemes', path: '/admin/government-schemes', isVisible: true, order: 5 },
      { id: 'an-6', label: 'Field Inspections', path: '/admin/field-inspections', isVisible: true, order: 6 },
    ],
    storageOwnerNav: [
      { id: 'sn-1', label: 'Facility Dashboard', path: '/storage-owner', isVisible: true, order: 1 },
    ],
  },
  footer: {
    description:
      'Farmer’s Gamble is a next-generation agricultural decision support system designed to minimize distress sales and empower Indian farmers through market transparency.',
    copyrightText: 'Designed and devoloped by Hakera _KARE',
    helplinePhone: '1800-180-1551 (Kisan Call Centre)',
    supportEmail: 'support@farmersgamble.gov.in',
    officeAddress: 'Krishi Bhavan, Shivaji Nagar, Pune - 411005, Maharashtra, India',
    links: [
      { id: 'fl-1', label: 'Agmarknet Portal', url: 'https://agmarknet.gov.in', openInNewTab: true },
      { id: 'fl-2', label: 'e-NAM National Market', url: 'https://www.enam.gov.in', openInNewTab: true },
      { id: 'fl-3', label: 'Dept. of Agriculture MH', url: 'https://krishi.maharashtra.gov.in', openInNewTab: true },
      { id: 'fl-4', label: 'Privacy & Security Policy', url: '#privacy', openInNewTab: false },
    ],
  },
  system: {
    maintenanceMode: false,
    maintenanceMessage: 'System is undergoing scheduled maintenance. Please check back shortly.',
    allowNewRegistrations: true,
    advisoryAlertsActive: true,
    enableLiveMarketFeed: true,
    demoModeActive: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system_default',
};
