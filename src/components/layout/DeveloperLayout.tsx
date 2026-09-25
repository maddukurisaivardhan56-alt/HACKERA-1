import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/authService';
import {
  Terminal,
  Activity,
  Layers,
  Palette,
  Layout,
  LogIn,
  Compass,
  Footprints,
  Users,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export type DeveloperTab =
  | 'overview'
  | 'cms-branding'
  | 'cms-theme'
  | 'cms-landing'
  | 'cms-login'
  | 'cms-navigation'
  | 'cms-footer'
  | 'users-roles'
  | 'system-config'
  | 'audit-logs';

interface DeveloperLayoutProps {
  children: React.ReactNode;
  activeTab: DeveloperTab;
  onTabChange: (tab: DeveloperTab) => void;
}

export const DeveloperLayout: React.FC<DeveloperLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsGroupOpen, setCmsGroupOpen] = useState(true);

  const devSession = AuthService.getDeveloperSession();

  const handleLogout = () => {
    AuthService.logoutDeveloper();
    navigate('/developer', { replace: true });
  };

  const navItems = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: Activity,
      group: 'main',
    },
    {
      id: 'cms-branding',
      label: 'Branding',
      icon: Sparkles,
      group: 'cms',
    },
    {
      id: 'cms-theme',
      label: 'Theme & Palette',
      icon: Palette,
      group: 'cms',
    },
    {
      id: 'cms-landing',
      label: 'Landing Page',
      icon: Layout,
      group: 'cms',
    },
    {
      id: 'cms-login',
      label: 'Login Page',
      icon: LogIn,
      group: 'cms',
    },
    {
      id: 'cms-navigation',
      label: 'Navigation',
      icon: Compass,
      group: 'cms',
    },
    {
      id: 'cms-footer',
      label: 'Footer',
      icon: Footprints,
      group: 'cms',
    },
    {
      id: 'users-roles',
      label: 'Users & Roles',
      icon: Users,
      group: 'system',
    },
    {
      id: 'system-config',
      label: 'System Config',
      icon: Settings,
      group: 'system',
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: History,
      group: 'system',
    },
  ];

  const handleTabClick = (tabId: DeveloperTab) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Engineering App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-3 sm:px-6 h-16 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Developer Portal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Farmer's Gamble Internal Control Room
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700"
          >
            <span>Public App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Developer Identity Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-xs font-medium text-slate-200 leading-none">
                {devSession.developerName || 'Lead Developer'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-none mt-1">
                {devSession.developerEmail || 'developer@hackara.in'}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 hover:text-red-200 text-xs font-medium transition-colors flex items-center gap-1.5 touch-manipulation min-h-[40px]"
            title="Sign Out of Developer Console"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900/50 border-r border-slate-800/80 p-4 space-y-6">
          {/* Section: Overview */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Telemetry
            </div>
            <button
              type="button"
              onClick={() => handleTabClick('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'overview'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>System Overview</span>
            </button>
          </div>

          {/* Section: CMS Subsystem */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Content Management
              </span>
              <button
                type="button"
                onClick={() => setCmsGroupOpen((prev) => !prev)}
                className="text-slate-400 hover:text-slate-300"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${cmsGroupOpen ? '' : '-rotate-90'}`}
                />
              </button>
            </div>

            {cmsGroupOpen && (
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.group === 'cms')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabClick(item.id as DeveloperTab)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Section: Administration & Audit */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Governance & Logs
            </div>
            <div className="space-y-1">
              {navItems
                .filter((item) => item.group === 'system')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id as DeveloperTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Sidebar Footer Security Status */}
          <div className="mt-auto pt-4 border-t border-slate-800/80 px-3">
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Role:</span>
                <span className="font-mono text-emerald-400 font-bold">Developer</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database RLS:</span>
                <span className="font-mono text-slate-300">Enforced</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Security Token:</span>
                <span className="font-mono text-slate-300">HMAC-SHA256</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-slate-900 border-r border-slate-800 z-10 shadow-2xl h-full p-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Developer Console</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Navigation
                  </div>
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabClick(item.id as DeveloperTab)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-800/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-full overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};
