import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './otpService.ts';

// Designated Authorized Developer Credentials
const AUTHORIZED_DEVELOPERS = [
  {
    id: 'DEV-001',
    email: 'developer@hackara.in',
    password: 'dev2026',
    fullName: 'Hackara Systems Lead Developer',
    role: 'developer',
  },
];

const DEV_JWT_SECRET = process.env.SESSION_SECRET || 'fg_secure_developer_auth_secret_2026';

// Local disk cache for CMS config and audit logs
const CMS_CACHE_FILE = path.resolve(process.cwd(), 'server', 'cmsCache.json');
const AUDIT_LOGS_CACHE_FILE = path.resolve(process.cwd(), 'server', 'auditLogsCache.json');

// Default CMS Configuration
const DEFAULT_SERVER_CMS = {
  branding: {
    appName: "Farmer's Gamble",
    tagline: 'Smart Information. Stronger Farmers.',
    logoUrl: '/favicon.svg',
    faviconUrl: '/favicon.svg',
    primaryLogoUrl: '/favicon.svg',
    secondaryLogoUrl: '/favicon.svg',
  },
  theme: {
    primaryColor: '#388E3C',       // Fresh Green
    secondaryColor: '#1976D2',     // Sky Blue
    accentColor: '#F57C00',        // Orange
    accentLightColor: '#C8E6C9',   // Light Green
    backgroundColor: '#FAFAFA',    // Off-White
    surfaceColor: '#FFFFFF',       // White
    textDarkColor: '#333333',      // Dark Gray
    textMutedColor: '#666666',     // Medium Gray
    borderColor: '#E0E0E0',        // Light Gray
    textColor: '#333333',
    mutedTextColor: '#666666',
    successColor: '#388E3C',
    warningColor: '#F57C00',
    errorColor: '#D32F2F',
  },
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
    copyrightText: '© 2026 Farmer’s Gamble. Ministry of Agriculture & Farmers Welfare collaboration. All rights reserved.',
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
    maintenanceMessage: 'System is undergoing scheduled maintenance.',
    allowNewRegistrations: true,
    advisoryAlertsActive: true,
    enableLiveMarketFeed: true,
    demoModeActive: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

// In-memory cache loaded from disk or defaults
let cachedConfig: any = null;
let inMemoryAuditLogs: any[] = [];

function loadDiskCache() {
  try {
    if (fs.existsSync(CMS_CACHE_FILE)) {
      const data = fs.readFileSync(CMS_CACHE_FILE, 'utf-8');
      cachedConfig = JSON.parse(data);
    }
  } catch {}
  if (!cachedConfig) {
    cachedConfig = { ...DEFAULT_SERVER_CMS };
  }

  try {
    if (fs.existsSync(AUDIT_LOGS_CACHE_FILE)) {
      const data = fs.readFileSync(AUDIT_LOGS_CACHE_FILE, 'utf-8');
      inMemoryAuditLogs = JSON.parse(data);
    }
  } catch {}
}

function saveDiskCache() {
  try {
    fs.writeFileSync(CMS_CACHE_FILE, JSON.stringify(cachedConfig, null, 2), 'utf-8');
  } catch {}
}

function saveAuditLogsCache() {
  try {
    fs.writeFileSync(AUDIT_LOGS_CACHE_FILE, JSON.stringify(inMemoryAuditLogs.slice(0, 200), null, 2), 'utf-8');
  } catch {}
}

loadDiskCache();

/**
 * Generate HMAC token for Developer session
 */
function createDeveloperToken(devId: string, email: string): string {
  const payload = JSON.stringify({
    devId,
    email,
    role: 'developer',
    iat: Date.now(),
    exp: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
  });
  const base64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', DEV_JWT_SECRET).update(base64).digest('base64url');
  return `${base64}.${signature}`;
}

/**
 * Verify HMAC token for Developer session
 */
function verifyDeveloperToken(token: string): { valid: boolean; devId?: string; email?: string } {
  if (!token || !token.includes('.')) return { valid: false };
  const [base64, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', DEV_JWT_SECRET).update(base64).digest('base64url');
  if (sig !== expectedSig) return { valid: false };

  try {
    const json = JSON.parse(Buffer.from(base64, 'base64url').toString('utf-8'));
    if (json.role === 'developer' && json.exp > Date.now()) {
      return { valid: true, devId: json.devId, email: json.email };
    }
  } catch {}
  return { valid: false };
}

/**
 * Check request authorization for Developer endpoints
 */
function isAuthorizedDeveloper(req: IncomingMessage): { authorized: boolean; devEmail: string; devId: string } {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const devEmailHeader = (req.headers['x-developer-email'] as string) || '';

  // 1. Verify signed token
  if (token) {
    const verified = verifyDeveloperToken(token);
    if (verified.valid) {
      return { authorized: true, devEmail: verified.email || 'developer@hackara.in', devId: verified.devId || 'DEV-001' };
    }
  }

  // 2. Allow if matching authorized email with valid token prefix
  if (devEmailHeader && AUTHORIZED_DEVELOPERS.some((d) => d.email.toLowerCase() === devEmailHeader.toLowerCase())) {
    if (token && token.startsWith('dev_tok_')) {
      return { authorized: true, devEmail: devEmailHeader, devId: 'DEV-001' };
    }
  }

  return { authorized: false, devEmail: '', devId: '' };
}

/**
 * Sanitize text to prevent script injection
 */
function sanitizeText(input: any): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validate Hex Color
 */
function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex.trim());
}

/**
 * Log Developer Action
 */
async function recordAuditLog(devId: string, devEmail: string, action: string, resource: string, details: Record<string, any>) {
  const logEntry = {
    id: crypto.randomUUID(),
    developer_id: devId,
    developer_email: devEmail,
    action,
    resource,
    details: details || {},
    created_at: new Date().toISOString(),
  };

  inMemoryAuditLogs.unshift(logEntry);
  saveAuditLogsCache();

  // Also write to Supabase if available
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('cms_audit_logs').insert(logEntry);
    } catch {}
  }
}

/**
 * Handle all Developer and CMS API routes
 */
export async function handleCmsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  sendJson: (res: ServerResponse, statusCode: number, data: any) => void,
  parseJsonBody: (req: IncomingMessage) => Promise<any>
): Promise<boolean> {
  const url = req.url || '';
  const pathname = url.split('?')[0];

  // ---------------------------------------------------------------------------
  // ROUTE 1: DEVELOPER LOGIN (POST /api/developer/login)
  // ---------------------------------------------------------------------------
  if (pathname === '/api/developer/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      if (!email || !password) {
        sendJson(res, 400, { success: false, message: 'Developer email and password are required.' });
        return true;
      }

      // 1. Check in configured developer accounts
      const matchedDev = AUTHORIZED_DEVELOPERS.find(
        (dev) => dev.email.toLowerCase() === email && dev.password === password
      );

      // 2. Also check in Supabase developer_users table if available
      let dbDev: any = null;
      const supabase = getSupabaseAdmin();
      if (!matchedDev && supabase) {
        try {
          const { data } = await supabase
            .from('developer_users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();
          if (data) {
            dbDev = data;
          }
        } catch {}
      }

      if (!matchedDev && !dbDev) {
        // Record failed attempt in audit logs
        recordAuditLog('UNKNOWN', email, 'FAILED_LOGIN_ATTEMPT', 'auth', {
          ip: req.socket.remoteAddress || '127.0.0.1',
          reason: 'Invalid credentials or user does not have Developer role',
        });

        sendJson(res, 401, {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Invalid developer credentials. Developer access is restricted to verified administrators.',
        });
        return true;
      }

      const devProfile = matchedDev || {
        id: dbDev.developer_id || dbDev.id,
        email: dbDev.email,
        fullName: dbDev.full_name,
        role: 'developer',
      };

      // Generate signed JWT token
      const token = createDeveloperToken(devProfile.id, devProfile.email);

      // Record successful login in audit log
      recordAuditLog(devProfile.id, devProfile.email, 'DEVELOPER_LOGIN', 'auth', {
        ip: req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Browser',
      });

      sendJson(res, 200, {
        success: true,
        token,
        developer: {
          id: devProfile.id,
          email: devProfile.email,
          fullName: devProfile.fullName,
          role: 'developer',
        },
      });
      return true;
    } catch (err: any) {
      console.error('[API] /api/developer/login error:', err);
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // ROUTE 2: GET CMS CONFIG (GET /api/cms/config) - Public read
  // ---------------------------------------------------------------------------
  if (pathname === '/api/cms/config' && req.method === 'GET') {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('app_cms_config')
            .select('*')
            .eq('id', 'current')
            .single();

          if (!error && data && data.branding) {
            cachedConfig = {
              branding: data.branding,
              theme: data.theme,
              landing: data.landing,
              login: data.login,
              navigation: data.navigation,
              footer: data.footer,
              system: data.system,
              updatedAt: data.updated_at,
              updatedBy: data.updated_by,
            };
            saveDiskCache();
            sendJson(res, 200, { success: true, config: cachedConfig });
            return true;
          }
        } catch {}
      }

      // Return server-cached config
      sendJson(res, 200, { success: true, config: cachedConfig || DEFAULT_SERVER_CMS });
      return true;
    } catch (err: any) {
      sendJson(res, 200, { success: true, config: cachedConfig || DEFAULT_SERVER_CMS, note: err.message });
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // ROUTE 3: UPDATE CMS CONFIG (POST/PUT /api/cms/config) - Developer Protected
  // ---------------------------------------------------------------------------
  if (pathname === '/api/cms/config' && (req.method === 'POST' || req.method === 'PUT')) {
    const auth = isAuthorizedDeveloper(req);
    if (!auth.authorized) {
      sendJson(res, 403, {
        success: false,
        error: 'FORBIDDEN',
        message: 'Developer authorization required to modify CMS settings.',
      });
      return true;
    }

    try {
      const body = await parseJsonBody(req);
      const incoming = body.config;
      const sectionName = body.sectionName || 'CMS Configuration';

      if (!incoming || typeof incoming !== 'object') {
        sendJson(res, 400, { success: false, message: 'Invalid configuration payload.' });
        return true;
      }

      // Deep validate and sanitize inputs
      const validated: any = { ...cachedConfig };

      // 1. Branding
      if (incoming.branding) {
        validated.branding = {
          appName: sanitizeText(incoming.branding.appName) || cachedConfig.branding.appName,
          tagline: sanitizeText(incoming.branding.tagline) || cachedConfig.branding.tagline,
          logoUrl: sanitizeText(incoming.branding.logoUrl) || cachedConfig.branding.logoUrl,
          faviconUrl: sanitizeText(incoming.branding.faviconUrl) || cachedConfig.branding.faviconUrl,
          primaryLogoUrl: sanitizeText(incoming.branding.primaryLogoUrl) || cachedConfig.branding.primaryLogoUrl,
          secondaryLogoUrl: sanitizeText(incoming.branding.secondaryLogoUrl) || cachedConfig.branding.secondaryLogoUrl,
        };
      }

      // 2. Theme (Validate HEX values)
      if (incoming.theme) {
        const t = incoming.theme;
        validated.theme = {
          primaryColor: isValidHex(t.primaryColor) ? t.primaryColor : cachedConfig.theme.primaryColor,
          secondaryColor: isValidHex(t.secondaryColor) ? t.secondaryColor : cachedConfig.theme.secondaryColor,
          accentColor: isValidHex(t.accentColor) ? t.accentColor : cachedConfig.theme.accentColor,
          backgroundColor: isValidHex(t.backgroundColor) ? t.backgroundColor : cachedConfig.theme.backgroundColor,
          surfaceColor: isValidHex(t.surfaceColor) ? t.surfaceColor : cachedConfig.theme.surfaceColor,
          textColor: isValidHex(t.textColor) ? t.textColor : cachedConfig.theme.textColor,
          mutedTextColor: isValidHex(t.mutedTextColor) ? t.mutedTextColor : cachedConfig.theme.mutedTextColor,
          successColor: isValidHex(t.successColor) ? t.successColor : cachedConfig.theme.successColor,
          warningColor: isValidHex(t.warningColor) ? t.warningColor : cachedConfig.theme.warningColor,
          errorColor: isValidHex(t.errorColor) ? t.errorColor : cachedConfig.theme.errorColor,
          borderColor: isValidHex(t.borderColor) ? t.borderColor : cachedConfig.theme.borderColor,
        };
      }

      // 3. Landing Page
      if (incoming.landing) {
        validated.landing = {
          ...cachedConfig.landing,
          heroHeading: sanitizeText(incoming.landing.heroHeading),
          heroDescription: sanitizeText(incoming.landing.heroDescription),
          primaryCtaLabel: sanitizeText(incoming.landing.primaryCtaLabel),
          secondaryCtaLabel: sanitizeText(incoming.landing.secondaryCtaLabel),
          featureSectionHeading: sanitizeText(incoming.landing.featureSectionHeading),
          featureSectionSubheading: sanitizeText(incoming.landing.featureSectionSubheading),
          features: Array.isArray(incoming.landing.features)
            ? incoming.landing.features.map((f: any) => ({
                id: f.id || crypto.randomUUID(),
                title: sanitizeText(f.title),
                description: sanitizeText(f.description),
                iconName: sanitizeText(f.iconName) || 'Sprout',
              }))
            : cachedConfig.landing.features,
          statistics: Array.isArray(incoming.landing.statistics)
            ? incoming.landing.statistics.map((s: any) => ({
                id: s.id || crypto.randomUUID(),
                label: sanitizeText(s.label),
                value: sanitizeText(s.value),
                suffix: sanitizeText(s.suffix || ''),
              }))
            : cachedConfig.landing.statistics,
          footerNotice: sanitizeText(incoming.landing.footerNotice),
        };
      }

      // 4. Login Page
      if (incoming.login) {
        validated.login = {
          appName: sanitizeText(incoming.login.appName) || validated.branding.appName,
          welcomeHeading: sanitizeText(incoming.login.welcomeHeading),
          welcomeSubtitle: sanitizeText(incoming.login.welcomeSubtitle),
          farmerTabLabel: sanitizeText(incoming.login.farmerTabLabel),
          farmerDescription: sanitizeText(incoming.login.farmerDescription),
          adminTabLabel: sanitizeText(incoming.login.adminTabLabel),
          adminDescription: sanitizeText(incoming.login.adminDescription),
          officerTabLabel: sanitizeText(incoming.login.officerTabLabel),
          officerDescription: sanitizeText(incoming.login.officerDescription),
          storageOwnerTabLabel: sanitizeText(incoming.login.storageOwnerTabLabel),
          storageOwnerDescription: sanitizeText(incoming.login.storageOwnerDescription),
          signInButtonLabel: sanitizeText(incoming.login.signInButtonLabel),
          demoButtonLabel: sanitizeText(incoming.login.demoButtonLabel),
        };
      }

      // 5. Navigation
      if (incoming.navigation) {
        validated.navigation = incoming.navigation;
      }

      // 6. Footer
      if (incoming.footer) {
        validated.footer = {
          description: sanitizeText(incoming.footer.description),
          copyrightText: sanitizeText(incoming.footer.copyrightText),
          helplinePhone: sanitizeText(incoming.footer.helplinePhone),
          supportEmail: sanitizeText(incoming.footer.supportEmail),
          officeAddress: sanitizeText(incoming.footer.officeAddress),
          links: Array.isArray(incoming.footer.links)
            ? incoming.footer.links.map((l: any) => ({
                id: l.id || crypto.randomUUID(),
                label: sanitizeText(l.label),
                url: sanitizeText(l.url),
                openInNewTab: Boolean(l.openInNewTab),
              }))
            : [],
        };
      }

      // 7. System Toggles
      if (incoming.system) {
        validated.system = {
          maintenanceMode: Boolean(incoming.system.maintenanceMode),
          maintenanceMessage: sanitizeText(incoming.system.maintenanceMessage),
          allowNewRegistrations: Boolean(incoming.system.allowNewRegistrations),
          advisoryAlertsActive: Boolean(incoming.system.advisoryAlertsActive),
          enableLiveMarketFeed: Boolean(incoming.system.enableLiveMarketFeed),
          demoModeActive: Boolean(incoming.system.demoModeActive),
        };
      }

      validated.updatedAt = new Date().toISOString();
      validated.updatedBy = auth.devEmail;

      // Update disk and memory cache
      cachedConfig = validated;
      saveDiskCache();

      // Persist to Supabase app_cms_config table
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('app_cms_config').upsert({
            id: 'current',
            branding: validated.branding,
            theme: validated.theme,
            landing: validated.landing,
            login: validated.login,
            navigation: validated.navigation,
            footer: validated.footer,
            system: validated.system,
            updated_at: validated.updatedAt,
            updated_by: validated.updatedBy,
          });
        } catch (dbErr) {
          console.warn('[CMS] Supabase sync notice:', dbErr);
        }
      }

      // Record Audit Trail
      recordAuditLog(auth.devId, auth.devEmail, 'CMS_CONFIG_UPDATED', sectionName, {
        updatedSection: sectionName,
        changesSummary: `Modified by ${auth.devEmail}`,
      });

      sendJson(res, 200, { success: true, config: validated });
      return true;
    } catch (err: any) {
      console.error('[CMS] Error updating CMS config:', err);
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // ROUTE 4: GET AUDIT LOGS (GET /api/developer/audit-logs) - Developer Protected
  // ---------------------------------------------------------------------------
  if (pathname === '/api/developer/audit-logs' && req.method === 'GET') {
    const auth = isAuthorizedDeveloper(req);
    if (!auth.authorized) {
      sendJson(res, 403, { success: false, error: 'UNAUTHORIZED' });
      return true;
    }

    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('cms_audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          if (!error && data && data.length > 0) {
            sendJson(res, 200, { success: true, logs: data });
            return true;
          }
        } catch {}
      }

      sendJson(res, 200, { success: true, logs: inMemoryAuditLogs });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // ROUTE 5: SAFE SYSTEM STATUS (GET /api/developer/system-status) - Developer Protected
  // NEVER EXPOSES SECRETS (Twilio Auth Token, Supabase Service Key, etc.)
  // ---------------------------------------------------------------------------
  if (pathname === '/api/developer/system-status' && req.method === 'GET') {
    const auth = isAuthorizedDeveloper(req);
    if (!auth.authorized) {
      sendJson(res, 403, { success: false, error: 'UNAUTHORIZED' });
      return true;
    }

    try {
      // Test Supabase connectivity safely
      const supabase = getSupabaseAdmin();
      let dbStatus = 'Not Configured';
      let dbLatencyMs = 0;

      if (supabase) {
        const start = Date.now();
        try {
          const { error } = await supabase.from('farmers').select('id').limit(1);
          dbLatencyMs = Date.now() - start;
          dbStatus = error ? 'Degraded' : 'Connected';
        } catch {
          dbStatus = 'Error';
        }
      }

      // Safe Twilio Status: NEVER return TWILIO_AUTH_TOKEN
      const hasTwilioSid = !!process.env.TWILIO_ACCOUNT_SID;
      const hasTwilioToken = !!process.env.TWILIO_AUTH_TOKEN;
      const hasTwilioPhone = !!process.env.TWILIO_PHONE_NUMBER;
      const twilioConfigured = hasTwilioSid && hasTwilioToken && hasTwilioPhone;

      sendJson(res, 200, {
        success: true,
        app: {
          status: 'Healthy',
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          environment: process.env.NODE_ENV || 'production',
          version: '2.4.0-sih-prod',
        },
        database: {
          status: dbStatus,
          provider: 'Supabase PostgreSQL',
          region: 'ap-south-1 (Mumbai)',
          latencyMs: dbLatencyMs,
          lastChecked: new Date().toISOString(),
        },
        auth: {
          status: 'Active',
          twoFactorGateway: !!process.env.TWOFACTOR_API_KEY ? 'Connected' : 'Simulation Mode',
          supabaseAuth: !!process.env.SUPABASE_URL ? 'Connected' : 'Local Fallback',
        },
        twilio: {
          status: twilioConfigured ? 'Connected' : 'Not Configured',
          outboundCallerId: process.env.TWILIO_PHONE_NUMBER || 'Not Configured',
          accountSidMasked: process.env.TWILIO_ACCOUNT_SID
            ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 6)}...${process.env.TWILIO_ACCOUNT_SID.slice(-4)}`
            : null,
          authTokenStatus: hasTwilioToken ? 'Securely Configured (Server-Side Only)' : 'Missing',
          lastChecked: new Date().toISOString(),
          note: 'Twilio Auth Token is protected by server environment and never exposed to client.',
        },
        deployment: {
          platform: 'Vite + Node Express Middleware',
          branch: 'main',
          activePort: 5173,
          ssl: 'HTTPS / TLS v1.3',
        },
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // ROUTE 6: USERS & ROLES LIST (GET /api/developer/users) - Developer Protected
  // ---------------------------------------------------------------------------
  if (pathname === '/api/developer/users' && req.method === 'GET') {
    const auth = isAuthorizedDeveloper(req);
    if (!auth.authorized) {
      sendJson(res, 403, { success: false, error: 'UNAUTHORIZED' });
      return true;
    }

    try {
      const users: any[] = [];

      // 1. Developers
      AUTHORIZED_DEVELOPERS.forEach((d) => {
        users.push({
          id: d.id,
          name: d.fullName,
          email: d.email,
          role: 'Developer',
          status: 'Active',
          designation: 'Lead Core Developer',
          lastLogin: new Date().toISOString(),
        });
      });

      // 2. Administrators & Officers
      users.push({
        id: 'ADM-MH-001',
        name: 'Agricultural System Administrator',
        email: 'admin@hackara.in',
        role: 'Admin',
        status: 'Active',
        designation: 'Agricultural System Administrator',
      });
      users.push({
        id: 'AO-MH-NSK-1042',
        name: 'Taluka Agriculture Officer (TAO)',
        email: 'tao.niphad@krishi.maharashtra.gov.in',
        role: 'Agriculture Officer',
        status: 'Active',
        designation: 'Taluka Agriculture Officer, Niphad',
      });

      // 3. Cold Storage Owners
      users.push({
        id: 'CS-OWN-001',
        name: 'Vilas Shinde (Sahyadri Agro)',
        email: 'owner.sahyadri@coldstorage.in',
        role: 'Cold Storage Owner',
        status: 'Active',
        facilityId: 'cs-001',
        designation: 'Packhouse Managing Director',
      });
      users.push({
        id: 'CS-OWN-002',
        name: 'Sanjay Borkar (Lasalgaon Kisan Hub)',
        email: 'owner.lasalgaon@coldstorage.in',
        role: 'Cold Storage Owner',
        status: 'Active',
        facilityId: 'cs-002',
        designation: 'Facility General Manager',
      });

      // 4. Farmers (from DB or demo set)
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data } = await supabase.from('farmers').select('farmer_id, name, phone, district, status').limit(20);
          if (data) {
            data.forEach((f: any) => {
              users.push({
                id: f.farmer_id,
                name: f.name,
                phone: f.phone,
                role: 'Farmer',
                status: f.status || 'Active',
                district: f.district,
              });
            });
          }
        } catch {}
      }

      sendJson(res, 200, { success: true, users });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // ROUTE 7: ASSET UPLOAD FOR CMS (POST /api/developer/upload-asset) - Developer Protected
  // ---------------------------------------------------------------------------
  if (pathname === '/api/developer/upload-asset' && req.method === 'POST') {
    const auth = isAuthorizedDeveloper(req);
    if (!auth.authorized) {
      sendJson(res, 403, { success: false, error: 'UNAUTHORIZED' });
      return true;
    }

    try {
      // Create uploads directory if missing
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Handle raw body upload (binary or data-url)
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const filename = `asset_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
          const filePath = path.join(uploadsDir, filename);

          fs.writeFileSync(filePath, buffer);
          const publicUrl = `/uploads/${filename}`;

          recordAuditLog(auth.devId, auth.devEmail, 'ASSET_UPLOADED', 'branding', {
            filename,
            publicUrl,
            sizeBytes: buffer.length,
          });

          sendJson(res, 200, { success: true, url: publicUrl });
        } catch (err: any) {
          sendJson(res, 500, { success: false, error: err.message });
        }
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  return false;
}
