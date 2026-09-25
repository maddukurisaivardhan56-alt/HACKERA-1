import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCMS } from '../../context/CMSContext';
import { AuthService } from '../../services/authService';
import { CMSService } from '../../services/cmsService';
import { DeveloperLayout, DeveloperTab } from '../../components/layout/DeveloperLayout';
import { CMSAuditLog, CMSThemeConfig } from '../../types';
import { DEFAULT_THEME_CONFIG } from '../../data/defaultCMSData';
import {
  Server,
  Database,
  ShieldCheck,
  PhoneCall,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Upload,
  RefreshCw,
  Eye,
  X,
  Plus,
  Trash2,
  Palette,
  Sparkles,
} from 'lucide-react';

interface ColorPaletteItemDef {
  role: string;
  name: string;
  key: keyof CMSThemeConfig;
  defaultHex: string;
  usage: string;
}

const COLOR_PALETTE_DEFINITIONS: ColorPaletteItemDef[] = [
  {
    role: 'Primary',
    name: 'Fresh Green',
    key: 'primaryColor',
    defaultHex: '#388E3C',
    usage: 'Navbar, primary buttons, main headings, active states',
  },
  {
    role: 'Secondary',
    name: 'Sky Blue',
    key: 'secondaryColor',
    defaultHex: '#1976D2',
    usage: 'Information sections, links, secondary buttons, informational elements',
  },
  {
    role: 'Accent',
    name: 'Orange',
    key: 'accentColor',
    defaultHex: '#F57C00',
    usage: 'Alerts, urgent advisories, "Call Now" buttons, price-drop warnings, important actions',
  },
  {
    role: 'Accent Light',
    name: 'Light Green',
    key: 'accentLightColor',
    defaultHex: '#C8E6C9',
    usage: 'Success cards, positive badges, "Store Recommended" banners, positive information areas',
  },
  {
    role: 'Background',
    name: 'Off-White',
    key: 'backgroundColor',
    defaultHex: '#FAFAFA',
    usage: 'Main page background',
  },
  {
    role: 'Surface',
    name: 'White',
    key: 'surfaceColor',
    defaultHex: '#FFFFFF',
    usage: 'Cards, panels, modals, tables',
  },
  {
    role: 'Text Dark',
    name: 'Dark Gray',
    key: 'textDarkColor',
    defaultHex: '#333333',
    usage: 'Body text, primary headings',
  },
  {
    role: 'Text Muted',
    name: 'Medium Gray',
    key: 'textMutedColor',
    defaultHex: '#666666',
    usage: 'Labels, secondary text, timestamps',
  },
  {
    role: 'Border',
    name: 'Light Gray',
    key: 'borderColor',
    defaultHex: '#E0E0E0',
    usage: 'Card borders, input fields, dividers',
  },
];

export const DeveloperDashboardPage: React.FC = () => {
  const {
    config,
    updateSection,
    resetThemeToDefault,
    applyThemePreview,
    cancelThemePreview,
  } = useCMS();

  const isDemo = AuthService.isDemoSession();
  const devSession = AuthService.getDeveloperSession();

  const [activeTab, setActiveTab] = useState<DeveloperTab>('overview');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // System status state
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<CMSAuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState('');

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);

  // Draft local forms
  const [draftBranding, setDraftBranding] = useState(config.branding);
  const [draftTheme, setDraftTheme] = useState(config.theme);
  const [draftLanding, setDraftLanding] = useState(config.landing);
  const [draftLogin, setDraftLogin] = useState(config.login);
  const [draftNav, setDraftNav] = useState(config.navigation);
  const [draftFooter, setDraftFooter] = useState(config.footer);
  const [draftSystem, setDraftSystem] = useState(config.system);

  // Sync draft states whenever global config updates
  useEffect(() => {
    setDraftBranding(config.branding);
    setDraftTheme(config.theme);
    setDraftLanding(config.landing);
    setDraftLogin(config.login);
    setDraftNav(config.navigation);
    setDraftFooter(config.footer);
    setDraftSystem(config.system);
  }, [config]);

  // Load telemetry & logs
  const loadSystemStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await CMSService.getSystemStatus();
      setSystemStatus(status);
    } catch {}
    setLoadingStatus(false);
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await CMSService.getAuditLogs();
      setAuditLogs(logs);
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const users = await CMSService.getUsers();
      setUsersList(users);
    } catch {}
  };

  useEffect(() => {
    loadSystemStatus();
    loadAuditLogs();
    loadUsers();
  }, []);

  const showToast = (success: boolean, msg: string) => {
    if (success) {
      setSaveSuccessMsg(msg);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } else {
      setSaveErrorMsg(msg);
      setTimeout(() => setSaveErrorMsg(null), 5000);
    }
  };

  // ---------------------------------------------------------------------------
  // SAVE HANDLERS
  // ---------------------------------------------------------------------------
  const handleSaveBranding = async () => {
    setIsSaving(true);
    const ok = await updateSection('branding', draftBranding);
    setIsSaving(false);
    if (ok) {
      showToast(true, 'Branding updated successfully across the entire application.');
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to save branding.');
    }
  };

  const handleSaveTheme = async () => {
    // Strict validation: Reject any invalid HEX colors across the 9 roles
    const invalidItems: string[] = [];
    for (const item of COLOR_PALETTE_DEFINITIONS) {
      const val = (draftTheme[item.key] as string) || '';
      if (!val || !CMSService.isValidHex(val)) {
        invalidItems.push(`${item.role} (${val || 'empty'})`);
      }
    }

    if (invalidItems.length > 0) {
      showToast(
        false,
        `Cannot save theme: Invalid HEX values for ${invalidItems.join(', ')}. Please use valid #RRGGBB format (e.g. #388E3C).`
      );
      return;
    }

    // Synchronize backward compatibility aliases
    const sanitizedTheme: CMSThemeConfig = {
      ...draftTheme,
      textColor: draftTheme.textDarkColor,
      mutedTextColor: draftTheme.textMutedColor,
      successColor: draftTheme.primaryColor,
      warningColor: draftTheme.accentColor,
      errorColor: draftTheme.errorColor || '#D32F2F',
    };

    setIsSaving(true);
    const ok = await updateSection('theme', sanitizedTheme);
    setIsSaving(false);
    if (ok) {
      cancelThemePreview();
      showToast(true, "Farmer's Gamble theme palette saved and globally applied.");
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to save theme changes to server.');
    }
  };

  const handleSaveLanding = async () => {
    setIsSaving(true);
    const ok = await updateSection('landing', draftLanding);
    setIsSaving(false);
    if (ok) {
      showToast(true, 'Landing page CMS content saved.');
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to save landing page content.');
    }
  };

  const handleSaveLogin = async () => {
    setIsSaving(true);
    const ok = await updateSection('login', draftLogin);
    setIsSaving(false);
    if (ok) {
      showToast(true, 'Login presentation content updated.');
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to save login content.');
    }
  };

  const handleSaveNavigation = async () => {
    setIsSaving(true);
    const ok = await updateSection('navigation', draftNav);
    setIsSaving(false);
    if (ok) {
      showToast(true, 'Navigation labels and visibility rules saved.');
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to save navigation.');
    }
  };

  const handleSaveFooter = async () => {
    setIsSaving(true);
    const ok = await updateSection('footer', draftFooter);
    setIsSaving(false);
    if (ok) {
      showToast(true, 'Footer text, contact info, and links saved.');
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to save footer content.');
    }
  };

  const handleSaveSystem = async () => {
    setIsSaving(true);
    const ok = await updateSection('system', draftSystem);
    setIsSaving(false);
    if (ok) {
      showToast(true, 'System configuration toggles updated.');
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to update system config.');
    }
  };

  // ---------------------------------------------------------------------------
  // THEME COLOR EDITOR HELPERS
  // ---------------------------------------------------------------------------
  const handleColorChange = (key: keyof CMSThemeConfig, rawVal: string) => {
    let cleanVal = rawVal.trim();
    if (cleanVal && !cleanVal.startsWith('#') && /^[0-9A-Fa-f]{3,6}$/.test(cleanVal)) {
      cleanVal = '#' + cleanVal;
    }
    const updated: CMSThemeConfig = { ...draftTheme, [key]: cleanVal };
    if (key === 'textDarkColor') {
      updated.textColor = cleanVal;
    }
    if (key === 'textMutedColor') {
      updated.mutedTextColor = cleanVal;
    }
    setDraftTheme(updated);
    applyThemePreview(updated);
  };

  const handleResetDraftTheme = () => {
    setDraftTheme(config.theme);
    cancelThemePreview();
    showToast(true, 'Discarded unsaved color changes.');
  };

  const handleCancelThemeChanges = () => {
    setDraftTheme(config.theme);
    cancelThemePreview();
    showToast(true, 'Reverted live preview to currently saved theme.');
  };

  const handleOpenResetDefaultModal = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmResetDefaultPalette = async () => {
    setShowResetConfirmModal(false);
    setIsSaving(true);
    const ok = await updateSection('theme', { ...DEFAULT_THEME_CONFIG });
    setIsSaving(false);
    if (ok) {
      setDraftTheme({ ...DEFAULT_THEME_CONFIG });
      resetThemeToDefault();
      cancelThemePreview();
      showToast(true, "Theme successfully restored to official Farmer's Gamble default palette.");
      loadAuditLogs();
    } else {
      showToast(false, 'Failed to reset theme defaults.');
    }
  };

  // Asset upload simulation / upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'primaryLogoUrl' | 'secondaryLogoUrl' | 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await CMSService.uploadAsset(file);
    if (res.success && res.url) {
      setDraftBranding((prev) => ({ ...prev, [targetField]: res.url! }));
      showToast(true, `Uploaded asset for ${targetField}.`);
    } else {
      // Create local object URL for preview
      const localUrl = URL.createObjectURL(file);
      setDraftBranding((prev) => ({ ...prev, [targetField]: localUrl }));
      showToast(true, `Loaded preview for ${targetField}.`);
    }
  };

  // Strictly block Judge Demo session from accessing Developer Portal
  if (isDemo) {
    return <Navigate to="/demo" replace />;
  }

  // Developer authorization check
  if (!devSession.isAuthenticated) {
    return <Navigate to="/developer" replace />;
  }

  return (
    <DeveloperLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Toast Alerts */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs sm:text-sm font-medium shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button type="button" onClick={() => setSaveSuccessMsg(null)}>
              <X className="w-4 h-4 text-emerald-400 hover:text-white" />
            </button>
          </div>
        )}

        {saveErrorMsg && (
          <div className="p-4 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 flex items-center justify-between text-xs sm:text-sm font-medium shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
            <button type="button" onClick={() => setSaveErrorMsg(null)}>
              <X className="w-4 h-4 text-red-400 hover:text-white" />
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 1: SYSTEM OVERVIEW                                              */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  System Architecture & Telemetry
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Real-time health telemetry across database, authentication, telephony, and edge nodes.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSystemStatus}
                disabled={loadingStatus}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 w-fit"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Application Node */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Application Status</h2>
                      <span className="text-[10px] text-slate-400 font-mono">Node.js Runtime</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Version:</span>
                    <span>{systemStatus?.app?.version || '2.4.0-sih-prod'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uptime:</span>
                    <span>{systemStatus?.app?.uptimeSeconds || 3600}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Memory:</span>
                    <span>{systemStatus?.app?.memoryUsageMb || 85} MB</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Supabase / Database */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-950 border border-teal-500/40 text-teal-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Supabase / Database</h2>
                      <span className="text-[10px] text-slate-400 font-mono">PostgreSQL RLS</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {systemStatus?.database?.status || 'Connected'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider:</span>
                    <span>{systemStatus?.database?.provider || 'Supabase PostgreSQL'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Region:</span>
                    <span>{systemStatus?.database?.region || 'ap-south-1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latency:</span>
                    <span>{systemStatus?.database?.latencyMs || 24} ms</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Authentication Subsystem */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Authentication Service</h2>
                      <span className="text-[10px] text-slate-400 font-mono">2Factor + Passwords</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    SECURED
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">OTP Gateway:</span>
                    <span>{systemStatus?.auth?.twoFactorGateway || 'Connected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Token Sig:</span>
                    <span>HMAC-SHA256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session Mode:</span>
                    <span>Multi-Role Isolated</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Twilio Voice Integration (SAFE VIEW - ZERO SECRETS DISPLAYED) */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Twilio Telephony</h2>
                      <span className="text-[10px] text-slate-400 font-mono">Programmable Voice</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {systemStatus?.twilio?.status || 'Connected'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Caller ID:</span>
                    <span>{systemStatus?.twilio?.outboundCallerId || '+17372508034'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auth Secret:</span>
                    <span className="text-emerald-400">Protected in Server Env</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Secrets are isolated server-side and never exposed to the client.
                  </div>
                </div>
              </div>

              {/* Card 5: Deployment Environment */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Deployment Status</h2>
                      <span className="text-[10px] text-slate-400 font-mono">Edge Pipeline</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    STABLE
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Platform:</span>
                    <span>{systemStatus?.deployment?.platform || 'Vite + Node API'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Branch:</span>
                    <span>main</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Layer:</span>
                    <span>{systemStatus?.deployment?.ssl || 'HTTPS / TLS 1.3'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: BRANDING MANAGEMENT                                          */}
        {/* =================================================================== */}
        {activeTab === 'cms-branding' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Branding & Identity Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Customize the public application name, official tagline, and emblem assets without rebuilding.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 w-fit cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>Save Branding</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Application Metadata</h2>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    APPLICATION NAME
                  </label>
                  <input
                    type="text"
                    value={draftBranding.appName}
                    onChange={(e) =>
                      setDraftBranding((prev) => ({ ...prev, appName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    OFFICIAL TAGLINE
                  </label>
                  <input
                    type="text"
                    value={draftBranding.tagline}
                    onChange={(e) =>
                      setDraftBranding((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    FAVICON URL / PATH
                  </label>
                  <input
                    type="text"
                    value={draftBranding.faviconUrl}
                    onChange={(e) =>
                      setDraftBranding((prev) => ({ ...prev, faviconUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Right Column: Logo & Emblem Uploads with Live Preview */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Logo & Emblem Preview</h2>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={draftBranding.primaryLogoUrl || '/favicon.svg'}
                      alt="Primary Logo Preview"
                      className="w-12 h-12 rounded-xl p-2 bg-[#043D2E] border border-emerald-500/30 object-contain shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon.svg';
                      }}
                    />
                    <div>
                      <div className="text-sm font-bold text-white">{draftBranding.appName}</div>
                      <div className="text-xs text-slate-400">{draftBranding.tagline}</div>
                    </div>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700 inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, 'primaryLogoUrl')}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    PRIMARY LOGO URL
                  </label>
                  <input
                    type="text"
                    value={draftBranding.primaryLogoUrl}
                    onChange={(e) =>
                      setDraftBranding((prev) => ({ ...prev, primaryLogoUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    SECONDARY LOGO URL
                  </label>
                  <input
                    type="text"
                    value={draftBranding.secondaryLogoUrl}
                    onChange={(e) =>
                      setDraftBranding((prev) => ({ ...prev, secondaryLogoUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: THEME & COLOR PALETTE EDITOR (WITH LIVE PREVIEW)             */}
        {/* =================================================================== */}
        {activeTab === 'cms-theme' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    CMS → THEME / COLOR PALETTE
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Palette className="w-6 h-6 text-emerald-400" />
                  <span>Global Theme & Color Palette Editor</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                  Configure the 9 primary color roles for the entire Farmer’s Gamble application. Changes update immediately in the live preview sandbox and across open portals.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCancelThemeChanges}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDraftTheme}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleOpenResetDefaultModal}
                  className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold border border-amber-600/40 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset to Default Palette</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveTheme}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left Column: 9 Editable Color Cards (xl:col-span-6) */}
              <div className="xl:col-span-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Global Color Roles ({COLOR_PALETTE_DEFINITIONS.length} Controlled Colors)</span>
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    HEX: #RRGGBB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {COLOR_PALETTE_DEFINITIONS.map((item) => {
                    const value = (draftTheme[item.key] as string) || '';
                    const isValid = CMSService.isValidHex(value);
                    return (
                      <div
                        key={item.key}
                        className={`p-4 rounded-xl bg-slate-900/95 border transition-all duration-200 flex flex-col justify-between ${
                          isValid ? 'border-slate-800 hover:border-slate-700' : 'border-red-500/60 bg-red-950/20'
                        }`}
                      >
                        <div>
                          {/* Role Badge & Color Name */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {item.role}
                            </span>
                            <span
                              className={`text-xs font-mono font-bold ${
                                isValid ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {value || 'EMPTY'}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-white tracking-tight mb-2">
                            {item.name}
                          </div>

                          {/* Inputs: Swatch, Native Picker, and Hex Input */}
                          <div className="flex items-center gap-2.5 mb-2.5">
                            {/* Live Swatch Box */}
                            <div
                              className="w-10 h-10 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center shrink-0 transition-transform active:scale-95"
                              style={{ backgroundColor: isValid ? value : '#1e293b' }}
                              title={`Current ${item.name} Preview`}
                            >
                              {!isValid && <AlertTriangle className="w-4 h-4 text-red-400" />}
                            </div>

                            {/* Color Picker input */}
                            <div className="relative shrink-0">
                              <input
                                type="color"
                                value={isValid ? value : '#000000'}
                                onChange={(e) => handleColorChange(item.key, e.target.value)}
                                className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-slate-950 p-1 hover:border-emerald-500 transition-colors"
                                title="Open Color Picker"
                              />
                            </div>

                            {/* HEX text input */}
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleColorChange(item.key, e.target.value)}
                                placeholder={item.defaultHex}
                                maxLength={7}
                                className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs font-mono text-white focus:outline-hidden uppercase transition-colors ${
                                  isValid
                                    ? 'border-slate-700 focus:border-emerald-500'
                                    : 'border-red-500 focus:border-red-400 text-red-200'
                                }`}
                              />
                            </div>
                          </div>

                          {!isValid && (
                            <div className="text-[10px] text-red-400 mb-2 font-mono flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Invalid HEX code. Use #RRGGBB format.</span>
                            </div>
                          )}
                        </div>

                        {/* Usage Description */}
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-snug">
                          <span className="font-semibold text-slate-300 block mb-0.5">Used for:</span>
                          <span className="text-slate-400">{item.usage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Live Preview Sandbox (xl:col-span-6, sticky) */}
              <div className="xl:col-span-6 space-y-4 xl:sticky xl:top-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Realistic Farmer’s Gamble Live Preview</span>
                  </h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE PREVIEW</span>
                  </div>
                </div>

                {/* Simulated Farmer's Gamble Screen Canvas */}
                <div
                  className="rounded-2xl border shadow-2xl transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: draftTheme.backgroundColor,
                    borderColor: draftTheme.borderColor,
                    color: draftTheme.textDarkColor,
                  }}
                >
                  {/* 1. Navbar Demonstration */}
                  <div
                    className="p-3.5 flex items-center justify-between shadow-xs transition-colors"
                    style={{
                      backgroundColor: draftTheme.primaryColor,
                      color: '#FFFFFF',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold shadow-xs">
                        🌾
                      </div>
                      <div>
                        <span className="font-bold text-sm tracking-tight block leading-tight">
                          Farmer's Gamble
                        </span>
                        <span className="text-[10px] text-white/80 block leading-none">
                          Smart Agricultural Advisory
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-white/90">
                      <span className="hover:text-white cursor-pointer border-b border-white/60 pb-0.5">Home</span>
                      <span className="hover:text-white cursor-pointer opacity-80">Market</span>
                      <span className="hover:text-white cursor-pointer opacity-80">Services</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90"
                        style={{ backgroundColor: draftTheme.secondaryColor }}
                      >
                        Explore Demo
                      </button>
                    </div>
                  </div>

                  {/* 2. Hero Statement & CTA Demonstration */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: draftTheme.accentLightColor,
                            color: draftTheme.textDarkColor,
                          }}
                        >
                          Empowering Cultivators
                        </span>
                      </div>
                      <h3
                        className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight"
                        style={{ color: draftTheme.textDarkColor }}
                      >
                        Helping Farmers Make Better Decisions
                      </h3>
                      <p
                        className="text-xs leading-relaxed max-w-xl"
                        style={{ color: draftTheme.textMutedColor }}
                      >
                        Scientific Sell vs. Store guidance, multi-mandi arbitrage comparisons, and licensed cold storage chamber reservations.
                      </p>
                    </div>

                    {/* Button Demonstration */}
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: draftTheme.primaryColor }}
                      >
                        Primary Action
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: draftTheme.secondaryColor }}
                      >
                        Secondary Action
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: draftTheme.accentColor }}
                      >
                        Call Now Advisory
                      </button>
                    </div>

                    {/* 3. Alert / Urgent Advisory Banner */}
                    <div
                      className="p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 shadow-xs"
                      style={{
                        backgroundColor: `${draftTheme.accentColor}1A`,
                        borderColor: draftTheme.accentColor,
                        color: draftTheme.textDarkColor,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">⚠️</span>
                        <div>
                          <strong className="block font-bold">Urgent Mandi Advisory:</strong>
                          <span>High supply influx detected in Nashik APMC. Algorithmic sell recommendation active.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shrink-0"
                        style={{ backgroundColor: draftTheme.accentColor }}
                      >
                        View Advisory
                      </button>
                    </div>

                    {/* 4. Realistic Cards (Market Price, Success, Information) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* Market Price Card */}
                      <div
                        className="p-3.5 rounded-xl border shadow-xs space-y-2"
                        style={{
                          backgroundColor: draftTheme.surfaceColor,
                          borderColor: draftTheme.borderColor,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: draftTheme.textMutedColor }}>
                            Market Price
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: draftTheme.secondaryColor }}
                          >
                            Verified APMC
                          </span>
                        </div>
                        <div className="text-xl font-black" style={{ color: draftTheme.textDarkColor }}>
                          ₹4,250 <span className="text-xs font-normal" style={{ color: draftTheme.textMutedColor }}>/ Quintal</span>
                        </div>
                        <div className="text-[11px] flex items-center justify-between" style={{ color: draftTheme.textMutedColor }}>
                          <span>Nashik APMC • Tomato Grade-A</span>
                          <span className="font-semibold text-emerald-700">▲ +4.2%</span>
                        </div>
                      </div>

                      {/* Success Card */}
                      <div
                        className="p-3.5 rounded-xl border shadow-xs space-y-2"
                        style={{
                          backgroundColor: draftTheme.accentLightColor,
                          borderColor: draftTheme.primaryColor,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: draftTheme.primaryColor }}
                          >
                            Success
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: draftTheme.primaryColor }}>
                            Store Recommended
                          </span>
                        </div>
                        <div className="text-sm font-bold" style={{ color: draftTheme.textDarkColor }}>
                          Good selling opportunity
                        </div>
                        <p className="text-[11px] leading-snug" style={{ color: draftTheme.textDarkColor }}>
                          Net profit realization +18% over local spot mandi after transport deduction.
                        </p>
                      </div>

                      {/* Information Card (Spanning or secondary) */}
                      <div
                        className="sm:col-span-2 p-3.5 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        style={{
                          backgroundColor: draftTheme.surfaceColor,
                          borderColor: draftTheme.borderColor,
                          borderLeftWidth: '4px',
                          borderLeftColor: draftTheme.secondaryColor,
                        }}
                      >
                        <div>
                          <div className="text-xs font-bold mb-0.5" style={{ color: draftTheme.textDarkColor }}>
                            Licensed Cold Storage Availability
                          </div>
                          <div className="text-[11px]" style={{ color: draftTheme.textMutedColor }}>
                            Mahindra Agri Cold Logistics: 140 MT available chamber capacity at 2.4°C.
                          </div>
                        </div>
                        <span
                          className="text-xs font-bold underline cursor-pointer shrink-0"
                          style={{ color: draftTheme.secondaryColor }}
                        >
                          Book Chamber Space →
                        </span>
                      </div>
                    </div>

                    {/* 5. Input Field & Form Element Demonstration */}
                    <div className="pt-1 space-y-1.5">
                      <label className="text-xs font-semibold block" style={{ color: draftTheme.textMutedColor }}>
                        Input Field Preview: Search Mandi or Crop
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="Pune APMC — Onion Red Grade-1"
                          className="flex-1 px-3 py-2 rounded-xl text-xs outline-hidden shadow-xs"
                          style={{
                            backgroundColor: draftTheme.surfaceColor,
                            borderColor: draftTheme.borderColor,
                            color: draftTheme.textDarkColor,
                            borderWidth: '1px',
                          }}
                        />
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                          style={{ backgroundColor: draftTheme.primaryColor }}
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    {/* 6. Status Badges Row Demonstration */}
                    <div className="pt-2 border-t space-y-1.5" style={{ borderColor: draftTheme.borderColor }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: draftTheme.textMutedColor }}>
                        Status Badges & Border Tokens
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold">
                        <span
                          className="px-2.5 py-1 rounded-md text-white font-bold"
                          style={{ backgroundColor: draftTheme.primaryColor }}
                        >
                          Primary Active
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md text-white font-bold"
                          style={{ backgroundColor: draftTheme.secondaryColor }}
                        >
                          Secondary Info
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md text-white font-bold"
                          style={{ backgroundColor: draftTheme.accentColor }}
                        >
                          Accent Warning
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md font-bold border"
                          style={{
                            backgroundColor: draftTheme.accentLightColor,
                            color: draftTheme.textDarkColor,
                            borderColor: draftTheme.primaryColor,
                          }}
                        >
                          Accent Light Success
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md font-bold border"
                          style={{
                            backgroundColor: draftTheme.surfaceColor,
                            color: draftTheme.textMutedColor,
                            borderColor: draftTheme.borderColor,
                          }}
                        >
                          Neutral Surface
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: LANDING PAGE CMS                                             */}
        {/* =================================================================== */}
        {activeTab === 'cms-landing' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Landing Page Content Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Safely edit hero statements, value propositions, and statistics without code changes.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveLanding}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 w-fit cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>Save Landing Page</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hero Section Content */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Hero Section Content</h2>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    HERO MAIN HEADING
                  </label>
                  <input
                    type="text"
                    value={draftLanding.heroHeading}
                    onChange={(e) =>
                      setDraftLanding((prev) => ({ ...prev, heroHeading: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    HERO DESCRIPTION / VALUE PROPOSITION
                  </label>
                  <textarea
                    rows={4}
                    value={draftLanding.heroDescription}
                    onChange={(e) =>
                      setDraftLanding((prev) => ({ ...prev, heroDescription: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      PRIMARY CTA LABEL
                    </label>
                    <input
                      type="text"
                      value={draftLanding.primaryCtaLabel}
                      onChange={(e) =>
                        setDraftLanding((prev) => ({ ...prev, primaryCtaLabel: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      SECONDARY CTA LABEL
                    </label>
                    <input
                      type="text"
                      value={draftLanding.secondaryCtaLabel}
                      onChange={(e) =>
                        setDraftLanding((prev) => ({ ...prev, secondaryCtaLabel: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    FOOTER NOTICE / SPONSORSHIP TEXT
                  </label>
                  <input
                    type="text"
                    value={draftLanding.footerNotice}
                    onChange={(e) =>
                      setDraftLanding((prev) => ({ ...prev, footerNotice: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Statistics & Section Headings */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Features & Metrics CMS</h2>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    FEATURE SECTION TITLE
                  </label>
                  <input
                    type="text"
                    value={draftLanding.featureSectionHeading}
                    onChange={(e) =>
                      setDraftLanding((prev) => ({
                        ...prev,
                        featureSectionHeading: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    FEATURE SECTION SUBHEADING
                  </label>
                  <input
                    type="text"
                    value={draftLanding.featureSectionSubheading}
                    onChange={(e) =>
                      setDraftLanding((prev) => ({
                        ...prev,
                        featureSectionSubheading: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                {/* Key Statistics Cards */}
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-mono text-slate-300 font-semibold">
                    KEY AGRICULTURAL STATISTICS (LIVE)
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {draftLanding.statistics.map((stat, idx) => (
                      <div
                        key={stat.id || idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                      >
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const updated = [...draftLanding.statistics];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setDraftLanding((prev) => ({ ...prev, statistics: updated }));
                          }}
                          placeholder="Label"
                          className="w-full text-[11px] text-slate-400 bg-transparent border-0 p-0 focus:ring-0"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => {
                              const updated = [...draftLanding.statistics];
                              updated[idx] = { ...updated[idx], value: e.target.value };
                              setDraftLanding((prev) => ({ ...prev, statistics: updated }));
                            }}
                            placeholder="Value"
                            className="w-20 text-base font-bold text-white bg-transparent border-0 p-0 font-mono focus:ring-0"
                          />
                          <input
                            type="text"
                            value={stat.suffix || ''}
                            onChange={(e) => {
                              const updated = [...draftLanding.statistics];
                              updated[idx] = { ...updated[idx], suffix: e.target.value };
                              setDraftLanding((prev) => ({ ...prev, statistics: updated }));
                            }}
                            placeholder="+"
                            className="w-8 text-sm font-bold text-emerald-400 bg-transparent border-0 p-0 focus:ring-0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: LOGIN PAGE CMS                                               */}
        {/* =================================================================== */}
        {activeTab === 'cms-login' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Login Page Presentation CMS
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Customize public login headers, role tab descriptions, and button labels. Developer remains strictly hidden.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveLogin}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 w-fit cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>Save Login Content</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Header Presentation */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Portal Welcome Headers</h2>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    WELCOME HEADING
                  </label>
                  <input
                    type="text"
                    value={draftLogin.welcomeHeading}
                    onChange={(e) =>
                      setDraftLogin((prev) => ({ ...prev, welcomeHeading: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    WELCOME SUBTITLE
                  </label>
                  <textarea
                    rows={3}
                    value={draftLogin.welcomeSubtitle}
                    onChange={(e) =>
                      setDraftLogin((prev) => ({ ...prev, welcomeSubtitle: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      SIGN IN BUTTON TEXT
                    </label>
                    <input
                      type="text"
                      value={draftLogin.signInButtonLabel}
                      onChange={(e) =>
                        setDraftLogin((prev) => ({ ...prev, signInButtonLabel: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      DEMO BUTTON TEXT
                    </label>
                    <input
                      type="text"
                      value={draftLogin.demoButtonLabel}
                      onChange={(e) =>
                        setDraftLogin((prev) => ({ ...prev, demoButtonLabel: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Role Descriptions */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Public Role Tab Labels & Descriptions</h2>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-mono text-emerald-400 font-semibold">1. FARMER TAB</div>
                    <input
                      type="text"
                      value={draftLogin.farmerDescription}
                      onChange={(e) =>
                        setDraftLogin((prev) => ({ ...prev, farmerDescription: e.target.value }))
                      }
                      className="w-full text-xs text-slate-200 bg-transparent border-0 p-0 focus:ring-0"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-mono text-teal-400 font-semibold">2. ADMIN TAB</div>
                    <input
                      type="text"
                      value={draftLogin.adminDescription}
                      onChange={(e) =>
                        setDraftLogin((prev) => ({ ...prev, adminDescription: e.target.value }))
                      }
                      className="w-full text-xs text-slate-200 bg-transparent border-0 p-0 focus:ring-0"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-mono text-indigo-400 font-semibold">3. AGRICULTURE OFFICER TAB</div>
                    <input
                      type="text"
                      value={draftLogin.officerDescription}
                      onChange={(e) =>
                        setDraftLogin((prev) => ({ ...prev, officerDescription: e.target.value }))
                      }
                      className="w-full text-xs text-slate-200 bg-transparent border-0 p-0 focus:ring-0"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-mono text-purple-400 font-semibold">4. COLD STORAGE OWNER TAB</div>
                    <input
                      type="text"
                      value={draftLogin.storageOwnerDescription}
                      onChange={(e) =>
                        setDraftLogin((prev) => ({ ...prev, storageOwnerDescription: e.target.value }))
                      }
                      className="w-full text-xs text-slate-200 bg-transparent border-0 p-0 focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 6: NAVIGATION CMS                                               */}
        {/* =================================================================== */}
        {activeTab === 'cms-navigation' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Navigation Menu CMS
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Configure navigation labels and visibility. Developer portal navigation is strictly private and excluded from public menus.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveNavigation}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 w-fit cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>Save Navigation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Farmer Navigation Items */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h2 className="text-sm font-semibold text-white mb-2">Farmer Portal Links</h2>
                <div className="space-y-2">
                  {draftNav.farmerNav.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const updated = [...draftNav.farmerNav];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setDraftNav((prev) => ({ ...prev, farmerNav: updated }));
                          }}
                          className="w-full text-xs font-medium text-white bg-transparent border-0 p-0 focus:ring-0"
                        />
                        <div className="text-[10px] text-slate-500 font-mono">{item.path}</div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={item.isVisible}
                          onChange={(e) => {
                            const updated = [...draftNav.farmerNav];
                            updated[idx] = { ...updated[idx], isVisible: e.target.checked };
                            setDraftNav((prev) => ({ ...prev, farmerNav: updated }));
                          }}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="text-[10px]">Visible</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin / Officer Navigation Items */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h2 className="text-sm font-semibold text-white mb-2">Officer Portal Links</h2>
                <div className="space-y-2">
                  {draftNav.adminNav.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const updated = [...draftNav.adminNav];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setDraftNav((prev) => ({ ...prev, adminNav: updated }));
                          }}
                          className="w-full text-xs font-medium text-white bg-transparent border-0 p-0 focus:ring-0"
                        />
                        <div className="text-[10px] text-slate-500 font-mono">{item.path}</div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={item.isVisible}
                          onChange={(e) => {
                            const updated = [...draftNav.adminNav];
                            updated[idx] = { ...updated[idx], isVisible: e.target.checked };
                            setDraftNav((prev) => ({ ...prev, adminNav: updated }));
                          }}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="text-[10px]">Visible</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 7: FOOTER CMS                                                   */}
        {/* =================================================================== */}
        {activeTab === 'cms-footer' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Footer CMS & Contact Information
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage official government contact helpline, office addresses, and verified public resources.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveFooter}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 w-fit cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>Save Footer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Contact Details & Copyright</h2>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    COPYRIGHT NOTICE
                  </label>
                  <input
                    type="text"
                    value={draftFooter.copyrightText}
                    onChange={(e) =>
                      setDraftFooter((prev) => ({ ...prev, copyrightText: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    HELPLINE PHONE / KISAN CALL CENTRE
                  </label>
                  <input
                    type="text"
                    value={draftFooter.helplinePhone}
                    onChange={(e) =>
                      setDraftFooter((prev) => ({ ...prev, helplinePhone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    OFFICIAL SUPPORT EMAIL
                  </label>
                  <input
                    type="email"
                    value={draftFooter.supportEmail}
                    onChange={(e) =>
                      setDraftFooter((prev) => ({ ...prev, supportEmail: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    OFFICE ADDRESS
                  </label>
                  <textarea
                    rows={2}
                    value={draftFooter.officeAddress}
                    onChange={(e) =>
                      setDraftFooter((prev) => ({ ...prev, officeAddress: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Public Resource Links */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-white">Public Links & Portals</h2>
                  <button
                    type="button"
                    onClick={() => {
                      const newLink = {
                        id: `link-${Date.now()}`,
                        label: 'New Public Resource',
                        url: 'https://',
                        openInNewTab: true,
                      };
                      setDraftFooter((prev) => ({
                        ...prev,
                        links: [...(prev.links || []), newLink],
                      }));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {(draftFooter.links || []).map((link, idx) => (
                    <div
                      key={link.id || idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...draftFooter.links];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setDraftFooter((prev) => ({ ...prev, links: updated }));
                          }}
                          placeholder="Link Label"
                          className="flex-1 text-xs text-white font-medium bg-transparent border-0 p-0 focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = draftFooter.links.filter((_, i) => i !== idx);
                            setDraftFooter((prev) => ({ ...prev, links: updated }));
                          }}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...draftFooter.links];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          setDraftFooter((prev) => ({ ...prev, links: updated }));
                        }}
                        placeholder="https://..."
                        className="w-full text-[11px] text-slate-400 font-mono bg-transparent border-0 p-0 focus:ring-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 8: USERS & ROLES                                                */}
        {/* =================================================================== */}
        {activeTab === 'users-roles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Authorized Users & Role Governance
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  View and manage accounts across all 5 official system roles (Farmer, Admin, Officer, Storage Owner, Developer).
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* Users Directory Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User Identifier</th>
                      <th className="py-3 px-4">Full Name / Designation</th>
                      <th className="py-3 px-4">Contact / Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-emerald-400">{user.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{user.name}</div>
                          {user.designation && (
                            <div className="text-[10px] text-slate-400">{user.designation}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {user.email || user.phone}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.role === 'Developer'
                                ? 'bg-purple-950 text-purple-400 border border-purple-500/30'
                                : user.role === 'Admin'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : user.role === 'Agriculture Officer'
                                ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/30'
                                : user.role === 'Cold Storage Owner'
                                ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {user.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 9: SYSTEM CONFIGURATION                                         */}
        {/* =================================================================== */}
        {activeTab === 'system-config' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  System Flags & Operational Toggles
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Safely enable or disable application features, emergency maintenance mode, and live data pipelines.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSystem}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 w-fit cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>Save System Flags</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Operational Feature Flags</h2>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Maintenance Mode</div>
                      <div className="text-[11px] text-slate-400">
                        Displays scheduled maintenance message to public users.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSystem.maintenanceMode}
                      onChange={(e) =>
                        setDraftSystem((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 border-slate-700 focus:ring-0"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Farmer Enrollment Allowed</div>
                      <div className="text-[11px] text-slate-400">
                        Allows authorized officers to enroll new farmers into system.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSystem.allowNewRegistrations}
                      onChange={(e) =>
                        setDraftSystem((prev) => ({
                          ...prev,
                          allowNewRegistrations: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 border-slate-700 focus:ring-0"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Proactive Advisory Engine</div>
                      <div className="text-[11px] text-slate-400">
                        Automated algorithm evaluating mandi spreads & weather alerts.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSystem.advisoryAlertsActive}
                      onChange={(e) =>
                        setDraftSystem((prev) => ({
                          ...prev,
                          advisoryAlertsActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 border-slate-700 focus:ring-0"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Judge Demo Access Mode</div>
                      <div className="text-[11px] text-slate-400">
                        Exposes safe fictional demonstration data for evaluation.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSystem.demoModeActive}
                      onChange={(e) =>
                        setDraftSystem((prev) => ({ ...prev, demoModeActive: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 border-slate-700 focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance message customization */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold text-white mb-2">Maintenance Banner Message</h2>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    CUSTOM MAINTENANCE BANNER (WHEN ACTIVE)
                  </label>
                  <textarea
                    rows={4}
                    value={draftSystem.maintenanceMessage}
                    onChange={(e) =>
                      setDraftSystem((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 10: AUDIT LOGS                                                  */}
        {/* =================================================================== */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Developer & CMS Audit Logs
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Immutable chronological audit trail recording all CMS modifications, theme updates, and developer logins.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter logs by action or user..."
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white w-56 font-mono"
                />
                <button
                  type="button"
                  onClick={loadAuditLogs}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Timestamp (UTC)</th>
                      <th className="py-3 px-4">Developer</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Resource Target</th>
                      <th className="py-3 px-4">Safe Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {auditLogs
                      .filter((log) => {
                        const devEmail = log.developerEmail || (log as any).developer_email || '';
                        const action = log.action || '';
                        const resource = log.resource || '';
                        return (
                          !auditFilter ||
                          action.toLowerCase().includes(auditFilter.toLowerCase()) ||
                          devEmail.toLowerCase().includes(auditFilter.toLowerCase()) ||
                          resource.toLowerCase().includes(auditFilter.toLowerCase())
                        );
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.createdAt || (log as any).created_at || '1970-01-01').toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">
                            {log.developerEmail || (log as any).developer_email}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-300">
                            {log.resource}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-xs">
                          No audit entries recorded yet. Modifications to CMS will appear here automatically.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal: Reset to Default Palette */}
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Reset to Default Color Palette?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Are you sure you want to permanently restore the Farmer’s Gamble global theme across all portals to the official system defaults?
                  </p>
                </div>
              </div>

              {/* List of default color values */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 max-h-56 overflow-y-auto">
                {COLOR_PALETTE_DEFINITIONS.map((c) => (
                  <div key={c.role} className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">
                      {c.role} ({c.name}):
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-sm border border-slate-700 shrink-0 inline-block"
                        style={{ backgroundColor: c.defaultHex }}
                      />
                      <span className="text-emerald-400 font-bold">{c.defaultHex}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-amber-300/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-600/30">
                ⚠️ All portals (Public Landing, Farmer, Admin, Officer, Cold Storage Owner, and Demo Access) will update immediately upon confirmation.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetDefaultPalette}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-950/40 inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Reset to Default</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeveloperLayout>
  );
};
