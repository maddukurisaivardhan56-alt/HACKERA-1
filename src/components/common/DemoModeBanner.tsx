import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  LogOut,
  AlertTriangle,
  X,
  Sprout,
  Shield,
  ClipboardCheck,
  Warehouse,
} from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
  const { session, isDemoMode, loginAsDemo, logout, demoNotice, clearDemoNotice } = useApp();
  const navigate = useNavigate();

  if (!isDemoMode) {
    return null;
  }

  const currentPortal =
    session.demoPortal === 'storage_owner' || session.role === 'storage_owner'
      ? 'storage_owner'
      : session.demoPortal === 'farmer' || session.role === 'farmer'
      ? 'farmer'
      : 'admin';

  const handleSwitchPortal = (target: 'farmer' | 'admin' | 'storage_owner') => {
    loginAsDemo(target);
    if (target === 'farmer') navigate('/farmer');
    else if (target === 'admin') navigate('/admin');
    else if (target === 'storage_owner') navigate('/storage-owner');
  };

  const handleExitDemo = async () => {
    await logout();
    navigate('/demo');
  };

  return (
    <>
      {/* RESTRICTED ACTION ALERT TOAST */}
      {demoNotice && (
        <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-bounce-short">
          <div className="bg-amber-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl border-2 border-amber-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-slate-950" />
              <span>{demoNotice}</span>
            </div>
            <button
              onClick={clearDemoNotice}
              className="p-1 hover:bg-amber-600/30 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}

      {/* TOP DEMO PERSISTENT SUB-BAR */}
      <aside aria-label="Demo Mode Notice" className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-1.5 border-b border-amber-600/30 shadow-xs z-30 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Left: Badge + Explanation */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 font-black text-[10px] sm:text-xs tracking-wider uppercase inline-flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              DEMO MODE
            </span>
            <span className="hidden sm:inline font-medium text-slate-900 text-[11px]">
              Exploring with safe demonstration data • Real carrier calls and production database writes are disabled.
            </span>
          </div>

          {/* Right: Portal Switcher & Exit */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-black/10 p-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchPortal('farmer')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                  currentPortal === 'farmer'
                    ? 'bg-slate-950 text-white font-bold shadow-xs'
                    : 'text-slate-900 hover:bg-black/10'
                }`}
                title="Switch to Farmer Portal Demo"
              >
                <Sprout className="w-3 h-3" />
                <span className="hidden xs:inline">Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPortal('admin')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                  currentPortal === 'admin'
                    ? 'bg-slate-950 text-white font-bold shadow-xs'
                    : 'text-slate-900 hover:bg-black/10'
                }`}
                title="Switch to Admin & Officer Portal Demo"
              >
                <Shield className="w-3 h-3" />
                <span className="hidden xs:inline">Admin & Officer</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPortal('storage_owner')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                  currentPortal === 'storage_owner'
                    ? 'bg-slate-950 text-white font-bold shadow-xs'
                    : 'text-slate-900 hover:bg-black/10'
                }`}
                title="Switch to Cold Storage Owner Portal Demo"
              >
                <Warehouse className="w-3 h-3" />
                <span className="hidden xs:inline">Storage</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExitDemo}
              className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-950 text-white font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              title="Exit demo session and return to demo hub"
            >
              <span>Exit Demo</span>
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
