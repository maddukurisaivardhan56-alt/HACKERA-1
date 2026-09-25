import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Sprout,
  Shield,
  ClipboardCheck,
  Warehouse,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  Globe,
  Radio,
  FileText,
  CalendarCheck,
} from 'lucide-react';
import { Language } from '../../types';

export const DemoAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsDemo, currentLanguage, setLanguage } = useApp();

  const handleOpenDemo = (portal: 'farmer' | 'admin' | 'officer' | 'storage_owner') => {
    loginAsDemo(portal);
    if (portal === 'farmer') {
      navigate('/farmer');
    } else if (portal === 'admin') {
      navigate('/admin');
    } else if (portal === 'officer') {
      navigate('/admin/farmer-support');
    } else if (portal === 'storage_owner') {
      navigate('/storage-owner');
    }
  };

  const portalCards = [
    {
      id: 'farmer' as const,
      name: 'Farmer Demo',
      badge: 'Crop & Mandi Advisory',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconBg: 'bg-emerald-700 text-[#F8E7C9]',
      icon: <Sprout className="w-6 h-6" />,
      description:
        'Explore the personalized farmer dashboard with APMC mandi price comparisons, Sell-or-Store decision engine, cold storage slot booking, and multi-lingual advisory history.',
      highlights: [
        'Live Mandi Price Comparison & Trends',
        'Sell-or-Store Profit Optimization Engine',
        'Cold Storage Facility Booking & Tracking',
        'Multi-lingual AI Advisory History',
      ],
      demoProfile: 'Ramesh Patil • Nashik, Maharashtra (Onion Farmer)',
      buttonText: 'Open Demo',
    },
    {
      id: 'admin' as const,
      name: 'Admin & Agriculture Officer Demo',
      badge: 'AI Telephony, Grievance & Inspection',
      tagColor: 'bg-teal-100 text-teal-800 border-teal-300',
      iconBg: 'bg-[#064E3B] text-[#F8E7C9]',
      icon: <Shield className="w-6 h-6" />,
      description:
        'Explore the unified administration dashboard featuring the 6-stage AI Calling journey, bulk voice call dispatcher, grievance resolution queue, and field inspection workflows.',
      highlights: [
        '6-Stage AI Calling Journey Dashboard',
        'Bulk AI Calling Queue Simulator (Safe Twilio)',
        'Farmer Support & Crop Grievance Queue',
        'Field Inspection & Damage Assessment',
      ],
      demoProfile: 'Agricultural Administrator & Officer',
      buttonText: 'Open Demo',
    },
    {
      id: 'storage_owner' as const,
      name: 'Cold Storage Owner Demo',
      badge: 'Warehouse Management',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      iconBg: 'bg-amber-600 text-white',
      icon: <Warehouse className="w-6 h-6" />,
      description:
        'Explore warehouse facility management, capacity utilization, incoming farmer produce appointment requests, and the interactive approve/reject/reschedule workflow.',
      highlights: [
        'Real-time Warehouse Capacity Tracking',
        'Farmer Produce Inward Booking Queue',
        'Interactive Approve / Reject / Reschedule Workflow',
        'WDRA Accredited Facility Dashboard',
      ],
      demoProfile: 'Sahyadri Agro Integrated Packhouse (cs-001)',
      buttonText: 'Open Demo',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col justify-between selection:bg-emerald-700 selection:text-white"
      style={{ backgroundColor: 'var(--color-background, #FAFAFA)' }}
    >
      
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 text-white shadow-md border-b"
        style={{
          backgroundColor: 'var(--color-primary, #388E3C)',
          borderColor: 'rgba(0,0,0,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand & Back Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-semibold border border-white/20 transition-colors shadow-2xs touch-manipulation"
              title="Return to official authentication page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Official Login</span>
              <span className="sm:hidden">Login</span>
            </Link>

            <div className="h-5 w-px bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs bg-white p-1 border border-white/40 shrink-0"
              >
                <img
                  src="/branding-symbol.png"
                  alt="Farmer's Gamble"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                Farmer&apos;s Gamble
              </span>
            </div>
          </div>

          {/* Right: Demo Badge & Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="px-2.5 py-1 rounded-full font-black text-[10px] sm:text-xs tracking-wider uppercase border shadow-xs inline-flex items-center gap-1.5 text-slate-900"
              style={{
                backgroundColor: 'var(--color-accent, #F57C00)',
                borderColor: 'var(--color-accent, #F57C00)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>JUDGE DEMO ACCESS</span>
            </span>

            {/* Language Selector */}
            <div className="hidden xs:flex items-center p-0.5 rounded-lg bg-black/20 border border-white/20 text-[11px]">
              <Globe className="w-3 h-3 text-white mx-1 shrink-0" />
              {(['en', 'mr', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    currentLanguage === lang
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'mr' ? 'मराठी' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-3 shadow-2xs"
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              borderColor: 'var(--color-border, #E0E0E0)',
              color: 'var(--color-primary, #388E3C)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent, #F57C00)' }} />
            <span>Interactive Evaluation Hub</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--color-text-dark, #333333)' }}
          >
            Farmer&apos;s Gamble Demo
          </h1>
          
          <p
            className="mt-2 sm:mt-3 text-sm sm:text-lg font-medium"
            style={{ color: 'var(--color-text-muted, #666666)' }}
          >
            Explore the major portals using demonstration data.
          </p>

          {/* Safety Notice Banner */}
          <div
            className="mt-4 p-3 rounded-xl border text-xs sm:text-[13px] flex items-center justify-center gap-2 shadow-2xs max-w-2xl mx-auto leading-relaxed"
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              borderColor: 'var(--color-border, #E0E0E0)',
              color: 'var(--color-text-dark, #333333)',
            }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary, #388E3C)' }} />
            <span>
              <strong>Safe Sandbox Environment:</strong> All records are fictional. Carrier PSTN calls and production database modifications are simulated and isolated.
            </span>
          </div>
        </div>

        {/* 3 Unified Demo Portal Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {portalCards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border-2 p-5 sm:p-7 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface, #FFFFFF)',
                borderColor: 'var(--color-border, #E0E0E0)',
              }}
            >
              <div className="relative z-10 space-y-4">
                {/* Card Header: Icon + Name + Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${card.iconBg} shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <h2
                        className="text-lg sm:text-xl font-bold leading-tight"
                        style={{ color: 'var(--color-text-dark, #333333)' }}
                      >
                        {card.name}
                      </h2>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${card.tagColor}`}>
                        {card.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-muted, #666666)' }}
                >
                  {card.description}
                </p>

                {/* Key Features Bullets */}
                <div
                  className="border rounded-xl p-3 space-y-1.5 text-xs"
                  style={{
                    backgroundColor: 'var(--color-background, #FAFAFA)',
                    borderColor: 'var(--color-border, #E0E0E0)',
                    color: 'var(--color-text-dark, #333333)',
                  }}
                >
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider block mb-1"
                    style={{ color: 'var(--color-primary, #388E3C)' }}
                  >
                    Key Features Demonstrated:
                  </span>
                  {card.highlights.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-primary, #388E3C)' }} />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Demo Identity context */}
                <div
                  className="text-[11px] flex items-center gap-1.5 pt-1 border-t"
                  style={{ borderColor: 'var(--color-border, #E0E0E0)', color: 'var(--color-text-muted, #666666)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--color-text-dark, #333333)' }}>Pre-configured Persona:</span>
                  <span className="truncate">{card.demoProfile}</span>
                </div>
              </div>

              {/* Action Button */}
              <div
                className="relative z-10 pt-5 mt-4 border-t"
                style={{ borderColor: 'var(--color-border, #E0E0E0)' }}
              >
                <button
                  type="button"
                  onClick={() => handleOpenDemo(card.id)}
                  className="w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation group/btn hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security & FAQ Footer Box */}
        <div className="mt-10 sm:mt-14 max-w-4xl mx-auto bg-[#FFFDF7]/90 border border-[#E0C79B] rounded-2xl p-4 sm:p-6 text-center text-xs text-slate-600 space-y-2 shadow-2xs">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Public Jury & Evaluator Guarantee</span>
          </div>
          <p className="max-w-2xl mx-auto leading-relaxed">
            All credentials, Twilio API tokens, and Supabase service-role secrets are strictly isolated on secure backend functions. In Demo Mode, telephony calls and database mutations operate entirely on mock demonstration buffers so you can test all features without side effects.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E0C79B] bg-[#FFFDF7] py-4 text-center text-xs text-[#064E3B]/70">
        Farmer&apos;s Gamble Smart Advisory System • Department of Agriculture Demonstration Hub • Smart India Hackathon
      </footer>
    </div>
  );
};
