import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useCMS } from '../../context/CMSContext';
import { Sprout, LogOut, Shield, Menu, X, Globe } from 'lucide-react';
import { FarmerSelector } from '../common/FarmerSelector';
import { Language } from '../../types';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}) => {
  const { session, logout, currentLanguage, setLanguage, t } = useApp();
  const { config } = useCMS();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublic = location.pathname === '/' || location.pathname === '/login';
  const isFarmer = location.pathname.startsWith('/farmer');
  const isAdmin = location.pathname.startsWith('/admin');

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <header
      className="sticky top-0 z-40 text-white shadow-md border-b"
      style={{
        backgroundColor: 'var(--color-primary, #388E3C)',
        borderColor: 'rgba(0,0,0,0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-3">
          
          {/* Left: Mobile menu button + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!isPublic && onToggleMobileSidebar && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#F8E7C9] hover:bg-[#043D2E] lg:hidden touch-manipulation"
                aria-label="Toggle Navigation"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link
              to={session.isAuthenticated ? (session.role === 'admin' ? '/admin' : '/farmer') : '/'}
              className="flex items-center gap-2 sm:gap-3 group"
            >
              {/* Professional Agricultural Emblem Logo */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 sm:p-1.5 flex items-center justify-center shadow-xs border border-[#E0C79B]/60 group-hover:border-[#F8E7C9] transition-all shrink-0">
                <img
                  src="/branding-symbol.png"
                  alt="Farmer's Gamble"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <span className="font-bold text-[#F8E7C9] text-sm sm:text-lg lg:text-xl tracking-tight leading-none group-hover:text-white transition-colors truncate max-w-[130px] sm:max-w-none">
                {config.branding.appName || t('appName', "Farmer's Gamble")}
              </span>
            </Link>

            {session.isDemo && (
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs tracking-wider uppercase border border-amber-300 shadow-xs inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                DEMO MODE
              </span>
            )}
          </div>

          {/* Middle: Active Profile badge (if on farmer portal) */}
          {isFarmer && (
            <div className="hidden md:flex items-center">
              <FarmerSelector />
            </div>
          )}

          {/* Right Navigation Controls + Multilingual Language Selector */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            
            {/* POLISHED SEGMENTED LANGUAGE SELECTOR */}
            <div className="inline-flex items-center p-0.5 sm:p-1 rounded-xl bg-[#043D2E] border border-[#E0C79B]/40 shadow-2xs">
              <div className="flex items-center gap-1 pl-1 pr-0.5 sm:pl-1.5 sm:pr-1 text-[#F8E7C9]/70">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F8E7C9] shrink-0" />
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('en')}
                  className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 touch-manipulation ${
                    currentLanguage === 'en'
                      ? 'bg-[#F8E7C9] text-[#064E3B] shadow-xs font-bold'
                      : 'text-[#F8E7C9]/80 hover:text-white hover:bg-[#064E3B]/80'
                  }`}
                  title="English"
                >
                  <span className="hidden sm:inline">English</span>
                  <span className="sm:hidden text-[11px] font-bold">EN</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageSelect('mr')}
                  className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 touch-manipulation ${
                    currentLanguage === 'mr'
                      ? 'bg-[#F8E7C9] text-[#064E3B] shadow-xs font-bold'
                      : 'text-[#F8E7C9]/80 hover:text-white hover:bg-[#064E3B]/80'
                  }`}
                  title="मराठी (Marathi)"
                >
                  <span className="hidden sm:inline">मराठी</span>
                  <span className="sm:hidden text-[11px] font-bold">म</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageSelect('hi')}
                  className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 touch-manipulation ${
                    currentLanguage === 'hi'
                      ? 'bg-[#F8E7C9] text-[#064E3B] shadow-xs font-bold'
                      : 'text-[#F8E7C9]/80 hover:text-white hover:bg-[#064E3B]/80'
                  }`}
                  title="हिंदी (Hindi)"
                >
                  <span className="hidden sm:inline">हिंदी</span>
                  <span className="sm:hidden text-[11px] font-bold">हि</span>
                </button>
              </div>
            </div>

            {isPublic ? (
              session.isAuthenticated ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    to={session.role === 'admin' ? '/admin' : '/farmer'}
                    className="inline-flex items-center justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#F8E7C9] text-[#064E3B] hover:bg-white shadow-xs transition-colors"
                  >
                    {session.role === 'admin' ? t('navAdminView', 'Admin View') : t('navFarmerView', 'Farmer View')} →
                  </Link>
                </div>
              ) : null
            ) : (
              <div className="flex items-center">
                {/* Logout */}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Log out"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#F8E7C9]/80 hover:bg-[#043D2E] hover:text-[#F8E7C9] transition-colors touch-manipulation"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
