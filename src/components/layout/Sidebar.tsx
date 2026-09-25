import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Scale,
  Warehouse,
  PhoneCall,
  ShieldCheck,
  HeartHandshake,
  Award,
  ClipboardCheck,
  X,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  role: 'farmer' | 'admin';
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
  exact?: boolean;
  highlight?: boolean;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, onCloseMobile }) => {
  const { advisories, t, currentLanguage } = useApp();

  const activeAdvisoriesCount = advisories.length;

  const farmerNav: NavItem[] = [
    {
      to: '/farmer',
      labelKey: 'navDashboard',
      defaultLabel: 'Farmer Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      exact: true,
    },
    {
      to: '/farmer/mandis',
      labelKey: 'navMandis',
      defaultLabel: 'Mandi Price Comparison',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      to: '/farmer/sell-or-store',
      labelKey: 'navSellOrStore',
      defaultLabel: 'Sell-or-Store Decision',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      to: '/farmer/cold-storage',
      labelKey: 'navColdStorage',
      defaultLabel: 'Cold-Storage Facilities',
      icon: <Warehouse className="w-4 h-4" />,
    },
    {
      to: '/farmer/advisories',
      labelKey: 'navAdvisories',
      defaultLabel: 'Advisory & Call History',
      icon: <PhoneCall className="w-4 h-4" />,
      badge: activeAdvisoriesCount > 0 ? activeAdvisoriesCount : undefined,
    },
  ];

  const adminNav: NavItem[] = [
    {
      to: '/admin',
      labelKey: 'navCallingDashboard',
      defaultLabel: 'AI Calling Dashboard',
      icon: <PhoneCall className="w-4 h-4" />,
      exact: true,
    },
    {
      to: '/admin/bulk-calling',
      labelKey: 'navBulkCalling',
      defaultLabel: 'Bulk AI Calling',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      to: '/admin/farmer-support',
      labelKey: 'navFarmerSupport',
      defaultLabel: 'Farmer Support',
      icon: <HeartHandshake className="w-4 h-4" />,
    },
    {
      to: '/admin/market-info',
      labelKey: 'navMarketPriceInfo',
      defaultLabel: 'Market & Price Info',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      to: '/admin/government-schemes',
      labelKey: 'navGovernmentSchemes',
      defaultLabel: 'Government Schemes',
      icon: <Award className="w-4 h-4" />,
    },
    {
      to: '/admin/field-inspections',
      labelKey: 'navFieldInspections',
      defaultLabel: 'Field Inspection & Monitoring',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
  ];

  const items = role === 'farmer' ? farmerNav : adminNav;

  return (
    <aside
      className="w-full lg:w-64 flex flex-col justify-between h-full lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 select-none border-r"
      style={{
        backgroundColor: 'var(--color-surface, #FFFFFF)',
        borderColor: 'var(--color-border, #E0E0E0)',
      }}
    >
      <div className="p-4 space-y-5 overflow-y-auto">
        
        {/* Role Banner & Mobile Close Header */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs"
          style={{
            backgroundColor: 'var(--color-background, #FAFAFA)',
            borderColor: 'var(--color-border, #E0E0E0)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-primary, #388E3C)' }} />
            <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-dark, #333333)' }}>
              {role === 'farmer'
                ? (currentLanguage === 'mr' ? 'शेतकरी पोर्टल' : currentLanguage === 'hi' ? 'किसान पोर्टल' : 'Farmer Portal')
                : (currentLanguage === 'mr' ? 'कृषी अधिकारी पोर्टल' : currentLanguage === 'hi' ? 'कृषि अधिकारी पोर्टल' : 'Agriculture Officer Portal')}
            </span>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-slate-500 hover:bg-black/5 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted, #666666)' }}>
            {currentLanguage === 'mr' ? 'मेनू पर्याय' : currentLanguage === 'hi' ? 'मेनू विकल्प' : 'Navigation Menu'}
          </div>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] touch-manipulation ${
                  isActive
                    ? 'shadow-xs font-bold text-white'
                    : 'text-slate-700 hover:bg-black/5 hover:text-slate-900'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: 'var(--color-primary, #388E3C)',
                      color: '#FFFFFF',
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{t(item.labelKey, item.defaultLabel)}</span>
              </div>
              {item.badge && (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white"
                  style={{ backgroundColor: 'var(--color-accent, #F57C00)' }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Quick Context Tip */}
        <div className="p-3 rounded-xl bg-[#F8E7C9]/40 border border-[#E0C79B]/80 text-[11px] text-[#064E3B]/80 leading-relaxed">
          <div className="font-bold text-[#064E3B] mb-1">
            {role === 'farmer' ? '🌾 Maharashtra Model' : '🏛️ Agriculture Officer Desk'}
          </div>
          <p>
            {role === 'farmer'
              ? (currentLanguage === 'mr'
                  ? 'लासलगाव, पिंपळगाव व पुणे बाजार समित्यांचे थेट भाव. साठवणूक भाडे विरुद्ध त्वरित विक्रीचे आर्थिक विश्लेषण.'
                  : currentLanguage === 'hi'
                  ? 'लासलगांव, पिंपलगांव और पुणे मंडियों के लाइव भाव। भंडारण किराया बनाम तत्काल बिक्री का आर्थिक विश्लेषण।'
                  : 'Live price feeds for Lasalgaon, Pimpalgaon, and Pune mandis. Financial models evaluate warehouse rent vs immediate liquidation.')
              : (currentLanguage === 'mr'
                  ? 'शेतकरी साहाय्यता विनंत्या, बाजारभाव विश्लेषण, शासकीय योजना व प्रत्यक्ष शेत पाहणी नोंदींचे व्यवस्थापन.'
                  : currentLanguage === 'hi'
                  ? 'किसान सहायता अनुरोध, मंडी भाव विश्लेषण, सरकारी योजनाएं और खेत निरीक्षण रिपोर्ट का प्रबंधन।'
                  : 'Manage farmer support tickets, market selling opportunities, government subsidy guidance, and field inspections.')}
          </p>
        </div>
      </div>

      {/* Footer Branding Info */}
      <div className="p-4 border-t border-[#E0C79B]/50 bg-[#F8E7C9]/30">
        <div className="flex items-center justify-between text-[11px] text-[#064E3B]/60 font-semibold">
          <span>Decision Intelligence</span>
          <span>Market Linkages</span>
        </div>
      </div>
    </aside>
  );
};
