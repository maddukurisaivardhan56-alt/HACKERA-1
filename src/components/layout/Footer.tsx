import React from 'react';
import { Sprout, ShieldAlert, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { t, currentLanguage } = useApp();

  return (
    <footer className="bg-[#FFFDF7] border-t border-[#E0C79B] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Problem statement */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center border border-[#E0C79B] shadow-2xs">
                <img
                  src="/branding-symbol.png"
                  alt="Farmer's Gamble"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <span className="font-bold text-[#064E3B] text-base tracking-tight">
                {t('appName', "Farmer's Gamble")}
              </span>
            </div>
            <p className="text-xs text-[#064E3B]/80 leading-relaxed max-w-md">
              {currentLanguage === 'mr'
                ? 'स्मार्ट इंडिया हॅकाथॉन २०२६ साठी विकसित केलेली एआय-समर्थित बाजारभाव आणि शीतगृह निर्णय साहाय्य प्रणाली. साठवणूक खर्चाचे गणित आणि स्वयंचलित व्हॉईस सल्ल्यांद्वारे शेतकऱ्यांना सक्षम बनवणे.'
                : currentLanguage === 'hi'
                ? 'स्मार्ट इंडिया हैकाथॉन 2026 के लिए विकसित एआई-सक्षम मंडी भाव और शीतगृह निर्णय सहायता प्रणाली। पारदर्शी भंडारण लागत गणना और स्वचालित वॉइस सलाह द्वारा किसानों का सशक्तिकरण।'
                : 'AI-assisted Mandi price intelligence and cold-storage decision support prototype developed for Smart India Hackathon 2026. Empowering agricultural producers with transparent holding cost calculations and automated voice advisories.'}
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-[#064E3B]/70 font-medium">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#064E3B]" />
                Team HACKARA
              </span>
              <span>•</span>
              <span>Problem Statement ID: SIH26132</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#064E3B] mb-3">
              {currentLanguage === 'mr' ? 'महत्त्वाचे दुवे' : currentLanguage === 'hi' ? 'महत्वपूर्ण लिंक्स' : 'Farmer Links'}
            </h4>
            <ul className="space-y-2 text-xs text-[#064E3B]/80">
              <li>
                <Link to="/farmer" className="hover:text-[#064E3B] hover:font-bold">
                  {t('navDashboard', 'Farmer Dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/farmer/mandis" className="hover:text-[#064E3B] hover:font-bold">
                  {t('navMandis', 'Mandi Price Comparison')}
                </Link>
              </li>
              <li>
                <Link to="/farmer/sell-or-store" className="hover:text-[#064E3B] hover:font-bold">
                  {t('navSellOrStore', 'Sell-or-Store Decision')}
                </Link>
              </li>
              <li>
                <Link to="/farmer/cold-storage" className="hover:text-[#064E3B] hover:font-bold">
                  {t('navColdStorage', 'Cold-Storage Facilities')}
                </Link>
              </li>
              <li>
                <Link to="/farmer/advisories" className="hover:text-[#064E3B] hover:font-bold">
                  {t('navAdvisories', 'Advisory & Call History')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Prototype Notice */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#064E3B] mb-3">
              {currentLanguage === 'mr' ? 'प्रोटोटाइप माहिती' : currentLanguage === 'hi' ? 'प्रोटोटाइप जानकारी' : 'Platform Notice'}
            </h4>
            <p className="text-[11px] text-[#064E3B]/70 leading-relaxed mb-3">
              {currentLanguage === 'mr'
                ? 'हा ॲप्लिकेशन SIH 2026 साठी विकसित केलेला निर्णय साहाय्य प्रोटोटाइप आहे. बाजारभाव व कॉल सिम्युलेशन स्थानिक पातळीवर चालतात.'
                : currentLanguage === 'hi'
                ? 'यह एप्लिकेशन SIH 2026 के लिए विकसित निर्णय सहायता प्रोटोटाइप है। मंडी भाव व कॉल सिमुलेशन स्थानीय रूप से चलते हैं।'
                : 'This application is an educational decision-support prototype developed for SIH 2026. Market trends and telephony workflows operate in simulated evaluation mode.'}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#064E3B]/10 border border-[#064E3B]/20 text-[11px] text-[#064E3B] font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-[#064E3B]" />
              <span>SIH 2026 Prototype Engine</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E0C79B]/50 flex flex-col sm:flex-row items-center justify-between text-xs text-[#064E3B]/60 gap-2">
          <div>{t('footerRights', "© 2026 Farmer's Gamble • Smart India Hackathon 2026 Prototype")}</div>
          <div>{t('footerDesc', 'Strengthening Market Linkages and Price Discovery for Farmers')}</div>
        </div>
      </div>
    </footer>
  );
};
