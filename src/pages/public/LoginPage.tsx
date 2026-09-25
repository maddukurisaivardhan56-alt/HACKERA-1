import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { Language } from '../../types';
import {
  Phone,
  Shield,
  Globe,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  ArrowLeft,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsFarmer, loginAsAdmin, loginAsStorageOwner, currentLanguage, setLanguage } = useApp();
  const { config } = useCMS();

  const [activeTab, setActiveTab] = useState<'farmer' | 'admin' | 'storage_owner'>('farmer');

  // Farmer login state — start completely blank with no demo prefill
  const [farmerPhone, setFarmerPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [farmerError, setFarmerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // Admin login state — start completely blank with no demo prefill
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Storage Owner login state
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Resend OTP cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Translations dictionary for dynamic language switching
  const translations = {
    en: {
      brandName: "Farmer's Gamble",
      brandTagline: "Smart Information. Stronger Farmers.",
      cardSlogan: "For a Greener, Stronger Tomorrow",
      sloganLine1: "शेतकरी समृद्ध",
      sloganLine2: "महाराष्ट्र समृद्ध",
      sloganLine3: "भारत समृद्ध",
      heroHeading1: "Empowering",
      heroHeading2: "Farmers for a",
      heroHeading3: "Brighter Tomorrow",
      heroSubtitle: "Access government schemes, market prices, storage information and expert support — all in one place.",
      pmName: "Shri Narendra Modi",
      pmTitle: "Hon'ble Prime Minister of India",
      cmName: "Shri Devendra Fadnavis",
      cmTitle: "Hon'ble Chief Minister\nMaharashtra",
      welcomeTitle: "Welcome to Farmer's Gamble",
      welcomeSubtitle: "Login to access authorized agriculture services",
      tabFarmer: "Farmer",
      tabOfficer: "Officer",
      tabOwner: "Cold Storage",
      mobileLabel: "Registered Mobile Number",
      mobilePlaceholder: "Enter 10-digit registered mobile",
      sendOtp: "Send Verification OTP →",
      otpLabel: "Enter 6-Digit OTP",
      otpPlaceholder: "••••••",
      verifyOtp: "Verify & Login →",
      resendOtp: "Resend OTP",
      changePhone: "Change Mobile Number",
      officerEmailLabel: "Officer Email Address",
      officerEmailPlaceholder: "Enter official officer email",
      officerPassLabel: "Officer Password",
      officerPassPlaceholder: "Enter password",
      officerLoginBtn: "Sign In as Officer →",
      ownerEmailLabel: "Facility Manager Email",
      ownerEmailPlaceholder: "Enter facility manager email",
      ownerPassLabel: "Password",
      ownerPassPlaceholder: "Enter password",
      ownerLoginBtn: "Sign In as Storage Owner →",
      govNotice: "Official Government Portal: Farmers are registered exclusively by the Department of Agriculture through authorized officer enrollment.",
      errInvalidPhone: "Please enter a valid 10-digit mobile number.",
      errNotRegistered: "This mobile number is not registered. Farmers must be registered through the authorized government registration process by an Agriculture Officer.",
      errNoRegisteredFarmers: "No registered farmers found in the system. Registration can only be completed by an Agriculture Officer.",
      errEmptyOtp: "Please enter the 6-digit OTP received.",
      otpDispatchedNotice: "Verification OTP sent to registered mobile",
    },
    mr: {
      brandName: "फार्मर्स गॅम्बल",
      brandTagline: "स्मार्ट माहिती. सक्षम शेतकरी.",
      cardSlogan: "हरित आणि समृद्ध उद्यासाठी",
      sloganLine1: "शेतकरी समृद्ध",
      sloganLine2: "महाराष्ट्र समृद्ध",
      sloganLine3: "भारत समृद्ध",
      heroHeading1: "शेतकऱ्यांचे सक्षमीकरण",
      heroHeading2: "उज्ज्वल",
      heroHeading3: "उद्याच्या भविष्यासाठी",
      heroSubtitle: "शासकीय योजना, बाजारभाव, साठवणूक माहिती आणि तज्ज्ञ सल्ला — सर्व एकाच ठिकाणी.",
      pmName: "मा. नरेंद्र मोदी",
      pmTitle: "मा. पंतप्रधान, भारत",
      cmName: "मा. देवेंद्र फडणवीस",
      cmTitle: "मा. मुख्यमंत्री\nमहाराष्ट्र",
      welcomeTitle: "फार्मर्स गॅम्बलमध्ये आपले स्वागत आहे",
      welcomeSubtitle: "अधिकृत कृषी सेवांसाठी लॉगिन करा",
      tabFarmer: "शेतकरी",
      tabOfficer: "अधिकारी",
      tabOwner: "शीतगृह",
      mobileLabel: "नोंदणीकृत मोबाईल क्रमांक",
      mobilePlaceholder: "१०-अंकी नोंदणीकृत मोबाईल टाका",
      sendOtp: "पडताळणी ओटीपी पाठवा →",
      otpLabel: "६-अंकी ओटीपी टाका",
      otpPlaceholder: "••••••",
      verifyOtp: "पडताळा आणि लॉगिन करा →",
      resendOtp: "ओटीपी पुन्हा पाठवा",
      changePhone: "मोबाईल क्रमांक बदला",
      officerEmailLabel: "अधिकारी ईमेल पत्ता",
      officerEmailPlaceholder: "अधिकृत ईमेल पत्ता टाका",
      officerPassLabel: "अधिकारी पासवर्ड",
      officerPassPlaceholder: "पासवर्ड टाका",
      officerLoginBtn: "अधिकारी म्हणून साइन इन करा →",
      ownerEmailLabel: "व्यवस्थापक ईमेल",
      ownerEmailPlaceholder: "अधिकृत व्यवस्थापक ईमेल टाका",
      ownerPassLabel: "पासवर्ड",
      ownerPassPlaceholder: "पासवर्ड टाका",
      ownerLoginBtn: "शीतगृह व्यवस्थापक लॉगिन →",
      govNotice: "अधिकृत शासकीय प्रणाली: शेतकरी नोंदणी केवळ कृषी विभागामार्फत अधिकृत अधिकारी प्रक्रियेद्वारे केली जाते.",
      errInvalidPhone: "कृपया १०-अंकी वैध मोबाईल क्रमांक टाका.",
      errNotRegistered: "हा मोबाईल क्रमांक नोंदणीकृत नाही. शेतकरी नोंदणी केवळ कृषी अधिकाऱ्यांमार्फत अधिकृत शासकीय प्रक्रियेद्वारे केली जाते.",
      errNoRegisteredFarmers: "प्रणालीमध्ये कोणताही नोंदणीकृत शेतकरी आढळला नाही. नोंदणी केवळ कृषी अधिकाऱ्यांमार्फत केली जाते.",
      errEmptyOtp: "कृपया आलेला ६-अंकी ओटीपी टाका.",
      otpDispatchedNotice: "नोंदणीकृत मोबाईलवर ओटीपी पाठवला आहे:",
    },
    hi: {
      brandName: "फार्मर्स गैंबल",
      brandTagline: "स्मार्ट जानकारी. सक्षम किसान.",
      cardSlogan: "हरित और समृद्ध कल के लिए",
      sloganLine1: "शेतकरी समृद्ध",
      sloganLine2: "महाराष्ट्र समृद्ध",
      sloganLine3: "भारत समृद्ध",
      heroHeading1: "किसानों का सशक्तिकरण",
      heroHeading2: "उज्ज्वल",
      heroHeading3: "भविष्य के निर्माण हेतु",
      heroSubtitle: "सरकारी योजनाएं, मंडी भाव, भंडारण जानकारी और विशेषज्ञ सहायता — सब एक ही स्थान पर।",
      pmName: "श्री नरेंद्र मोदी",
      pmTitle: "माननीय प्रधानमंत्री, भारत",
      cmName: "श्री देवेंद्र फडणवीस",
      cmTitle: "माननीय मुख्यमंत्री\nमहाराष्ट्र",
      welcomeTitle: "फार्मर्स गैंबल में आपका स्वागत है",
      welcomeSubtitle: "अधिकृत कृषि सेवाओं के लिए लॉगिन करें",
      tabFarmer: "किसान",
      tabOfficer: "अधिकारी",
      tabOwner: "कोल्ड स्टोरेज",
      mobileLabel: "पंजीकृत मोबाइल नंबर",
      mobilePlaceholder: "१०-अंकों का पंजीकृत मोबाइल दर्ज करें",
      sendOtp: "सत्यापन ओटीपी भेजें →",
      otpLabel: "६-अंकों का ओटीपी दर्ज करें",
      otpPlaceholder: "••••••",
      verifyOtp: "सत्यापित करें और लॉगिन करें →",
      resendOtp: "ओटीपी पुनः भेजें",
      changePhone: "मोबाइल नंबर बदलें",
      officerEmailLabel: "अधिकारी ईमेल पता",
      officerEmailPlaceholder: "आधिकारिक ईमेल दर्ज करें",
      officerPassLabel: "अधिकारी पासवर्ड",
      officerPassPlaceholder: "पासवर्ड दर्ज करें",
      officerLoginBtn: "अधिकारी के रूप में साइन इन करें →",
      ownerEmailLabel: "प्रबंधक ईमेल",
      ownerEmailPlaceholder: "आधिकारिक प्रबंधक ईमेल दर्ज करें",
      ownerPassLabel: "पासवर्ड",
      ownerPassPlaceholder: "पासवर्ड दर्ज करें",
      ownerLoginBtn: "स्टोरेज प्रबंधक लॉगिन करें →",
      govNotice: "अधिकृत सरकारी पोर्टल: किसान पंजीकरण केवल कृषि विभाग द्वारा अधिकृत अधिकारी प्रक्रिया के माध्यम से किया जाता है।",
      errInvalidPhone: "कृपया १०-अंकों का वैध मोबाइल नंबर दर्ज करें।",
      errNotRegistered: "यह मोबाइल नंबर पंजीकृत नहीं है। किसान पंजीकरण केवल अधिकृत सरकारी प्रक्रिया द्वारा कृषि अधिकारियों के माध्यम से किया जाता है।",
      errNoRegisteredFarmers: "सिस्टम में कोई पंजीकृत किसान नहीं मिला। पंजीकरण केवल कृषि अधिकारी द्वारा किया जा सकता है।",
      errEmptyOtp: "कृपया प्राप्त ६-अंकों का ओटीपी दर्ज करें।",
      otpDispatchedNotice: "पंजीकृत मोबाइल पर ओटीपी भेजा गया है:",
    },
  };

  const t = (translations as Record<string, any>)[currentLanguage] || translations.en;

  // Handle OTP request for registered farmer
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFarmerError(null);
    setOtpNotice(null);

    const cleaned = farmerPhone.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 10) {
      setFarmerError(t.errInvalidPhone);
      return;
    }

    setIsLoading(true);
    const res = await AuthService.requestFarmerOTP(farmerPhone);
    setIsLoading(false);

    if (!res.success) {
      if (res.error === 'NOT_REGISTERED') {
        setFarmerError(t.errNotRegistered);
      } else if (res.error === 'RATE_LIMIT_EXCEEDED' || res.error === 'COOLDOWN_ACTIVE') {
        setFarmerError(res.message || 'Too many attempts. Please wait.');
      } else if (res.error === 'SERVICE_UNCONFIGURED') {
        setFarmerError(res.message || 'SMS service is not configured on server.');
      } else {
        setFarmerError(res.message || t.errNotRegistered);
      }
      return;
    }

    // Success: Real OTP dispatched to registered farmer's mobile via 2Factor
    setOtpSent(true);
    setOtpValue('');
    setSessionId(res.sessionId || null);
    if (res.cooldownSeconds) {
      setCooldown(res.cooldownSeconds);
    }
    setOtpNotice(`${t.otpDispatchedNotice} ${res.maskedPhone}. Please enter the 6-digit code received via SMS.`);
  };

  // Handle Farmer OTP verification
  const handleVerifyFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFarmerError(null);

    if (!otpValue.trim()) {
      setFarmerError(t.errEmptyOtp);
      return;
    }

    setIsLoading(true);
    const res = await loginAsFarmer(farmerPhone, otpValue.trim(), sessionId || undefined);
    setIsLoading(false);

    if (res.success) {
      navigate('/farmer');
    } else {
      setFarmerError(res.error || 'Invalid verification code. Please try again.');
    }
  };

  // Handle Officer login with authentic credentials
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Please enter official officer email and password.');
      return;
    }

    const res = loginAsAdmin(adminEmail.trim(), adminPassword.trim());
    if (res.success) {
      navigate('/admin');
    } else {
      setAdminError(res.error || 'Invalid officer credentials. Access restricted to authorized personnel.');
    }
  };

  // Handle Cold Storage Owner login
  const handleStorageOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);

    if (!ownerEmail.trim() || !ownerPassword.trim()) {
      setOwnerError('Please enter facility manager email and password.');
      return;
    }

    const res = loginAsStorageOwner(ownerEmail.trim(), ownerPassword.trim());
    if (res.success) {
      navigate('/storage-owner');
    } else {
      setOwnerError(res.error || 'Invalid manager credentials.');
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center lg:justify-end p-3 sm:p-6 lg:pr-16 xl:pr-24 overflow-x-hidden select-none"
      style={{
        backgroundImage: "url('/images/fullscreen_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle Warm Sunset & Nature Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.12) 0%, rgba(6, 78, 59, 0.06) 45%, rgba(0, 0, 0, 0.18) 100%)',
        }}
      />

      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-800 text-xs font-semibold backdrop-blur-md shadow-md border border-white/60 transition-all hover:scale-105 touch-manipulation"
        title="Return to Farmer's Gamble Home"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Home</span>
      </Link>

      {/* Login Card Area - positioned near the sun on desktop with glassmorphism */}
      <div className="w-full max-w-[430px] my-auto relative z-20 py-4 flex items-center justify-center">
        <div
          className="w-full rounded-2xl border p-3.5 sm:p-5 transition-all backdrop-blur-xl backdrop-saturate-150 shadow-[0_20px_50px_rgba(0,0,0,0.25),_0_0_35px_rgba(245,124,0,0.18)]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            borderColor: 'rgba(255, 255, 255, 0.75)',
          }}
        >
          {/* Card Top Row: Logo + Language Selector */}
          <div
            className="flex items-center justify-between gap-2 border-b pb-3"
            style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs shrink-0 bg-white p-0.5 border border-emerald-200"
              >
                <img
                  src="/branding-symbol.png"
                  alt="Farmer's Gamble"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div>
                <h3
                  className="text-xs sm:text-sm font-bold leading-none"
                  style={{ color: 'var(--color-primary, #388E3C)' }}
                >
                  {config.branding.appName || t.brandName}
                </h3>
                <span
                  className="text-[9px] font-medium block mt-0.5"
                  style={{ color: 'var(--color-text-muted, #666666)' }}
                >
                  {config.branding.tagline || t.cardSlogan}
                </span>
              </div>
            </div>

            {/* SEGMENTED LANGUAGE SELECTOR */}
            <div
              className="flex items-center p-0.5 rounded-lg border text-[11px] backdrop-blur-md shrink-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                borderColor: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              <Globe className="w-3 h-3 mx-1 shrink-0" style={{ color: 'var(--color-primary, #388E3C)' }} />
              {(['en', 'mr', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    currentLanguage === lang
                      ? 'shadow-xs font-bold text-white'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    currentLanguage === lang
                      ? { backgroundColor: 'var(--color-primary, #388E3C)', color: '#FFFFFF' }
                      : { color: 'var(--color-text-dark, #333333)', backgroundColor: 'transparent' }
                  }
                >
                  <span className="hidden sm:inline">{lang === 'en' ? 'English' : lang === 'mr' ? 'मराठी' : 'हिंदी'}</span>
                  <span className="sm:hidden">{lang === 'en' ? 'EN' : lang === 'mr' ? 'म' : 'हि'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Welcome Heading */}
          <div className="mt-3 mb-3">
            <h4
              className="text-base sm:text-lg font-bold leading-tight"
              style={{ color: 'var(--color-text-dark, #333333)' }}
            >
              {config.login.welcomeHeading || t.welcomeTitle}
            </h4>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--color-text-muted, #666666)' }}
            >
              {config.login.welcomeSubtitle || t.welcomeSubtitle}
            </p>
          </div>

          {/* Tri-Tab Switcher with glassmorphism */}
          <div
            className="grid grid-cols-3 gap-1 p-1 border rounded-xl mb-3 text-[11px] font-semibold backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('farmer');
                setFarmerError(null);
              }}
              className="py-2 px-1 min-h-[40px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation"
              style={
                activeTab === 'farmer'
                  ? { backgroundColor: 'var(--color-primary, #388E3C)', color: '#FFFFFF', fontWeight: 'bold' }
                  : { color: 'var(--color-text-dark, #333333)' }
              }
            >
              <Sprout className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.tabFarmer}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setAdminError(null);
              }}
              className="py-2 px-1 min-h-[40px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation"
              style={
                activeTab === 'admin'
                  ? { backgroundColor: 'var(--color-primary, #388E3C)', color: '#FFFFFF', fontWeight: 'bold' }
                  : { color: 'var(--color-text-dark, #333333)' }
              }
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.tabOfficer}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('storage_owner');
                setOwnerError(null);
              }}
              className="py-2 px-1 min-h-[40px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation"
              style={
                activeTab === 'storage_owner'
                  ? { backgroundColor: 'var(--color-primary, #388E3C)', color: '#FFFFFF', fontWeight: 'bold' }
                  : { color: 'var(--color-text-dark, #333333)' }
              }
            >
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.tabOwner}</span>
            </button>
          </div>

          {/* TAB 1: FARMER LOGIN */}
          {activeTab === 'farmer' && (
            <div className="space-y-3">
              {!otpSent ? (
                /* Standard Login Form */
                <form onSubmit={handleRequestOTP} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t.mobileLabel}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={farmerPhone}
                        onChange={(e) => {
                          setFarmerPhone(e.target.value);
                          if (farmerError) setFarmerError(null);
                        }}
                        placeholder={t.mobilePlaceholder}
                        className="w-full pl-9 pr-3 py-2.5 bg-white/85 border border-slate-200/90 rounded-xl text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white shadow-xs backdrop-blur-sm"
                        required
                        autoFocus
                      />
                    </div>
                    {farmerError && (
                      <div className="mt-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] leading-tight flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{farmerError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 min-h-[44px] rounded-xl text-white text-xs sm:text-sm font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 touch-manipulation hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
                  >
                    <span>{isLoading ? '...' : t.sendOtp}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyFarmer} className="space-y-3 animate-fade-in">
                  {otpNotice && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-1.5 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{otpNotice}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t.otpLabel}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => {
                        setOtpValue(e.target.value);
                        if (farmerError) setFarmerError(null);
                      }}
                      placeholder={t.otpPlaceholder}
                      className="w-full text-center py-2.5 bg-white/85 border border-slate-300/90 rounded-xl text-base font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none backdrop-blur-sm shadow-xs"
                      required
                      autoFocus
                    />
                    {farmerError && (
                      <div className="mt-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] leading-tight flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{farmerError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 min-h-[44px] rounded-xl text-white text-xs sm:text-sm font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
                  >
                    <span>{t.verifyOtp}</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpValue('');
                        setFarmerError(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 underline cursor-pointer min-h-[36px] flex items-center"
                    >
                      {t.changePhone}
                    </button>
                    <button
                      type="button"
                      disabled={cooldown > 0 || isLoading}
                      onClick={handleRequestOTP}
                      className={`min-h-[36px] flex items-center ${
                        cooldown > 0 || isLoading
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-emerald-700 font-bold hover:underline cursor-pointer'
                      }`}
                    >
                      {cooldown > 0 ? `${t.resendOtp} (${cooldown}s)` : t.resendOtp}
                    </button>
                  </div>
                </form>
              )}

              {/* Official Government Registration Authorization Notice */}
              <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-center gap-1.5 leading-relaxed">
                <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{t.govNotice}</span>
              </div>
            </div>
          )}

          {/* TAB 2: AGRICULTURE OFFICER LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-3 animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {t.officerEmailLabel}
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (adminError) setAdminError(null);
                  }}
                  placeholder={t.officerEmailPlaceholder}
                  className="w-full px-3 py-2.5 bg-white/85 border border-slate-200/90 rounded-xl text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-xs focus:outline-none backdrop-blur-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {t.officerPassLabel}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (adminError) setAdminError(null);
                  }}
                  placeholder={t.officerPassPlaceholder}
                  className="w-full px-3 py-2.5 bg-white/85 border border-slate-200/90 rounded-xl text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-xs focus:outline-none backdrop-blur-sm"
                  required
                />
              </div>

              {adminError && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] leading-tight flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 min-h-[44px] rounded-xl text-white text-xs sm:text-sm font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
              >
                <span>{t.officerLoginBtn}</span>
              </button>

              <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-center gap-1.5 leading-relaxed">
                <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Authorized agricultural officer credentials required for departmental access.</span>
              </div>
            </form>
          )}

          {/* TAB 3: COLD STORAGE OWNER LOGIN */}
          {activeTab === 'storage_owner' && (
            <form onSubmit={handleStorageOwnerLogin} className="space-y-3 animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {t.ownerEmailLabel}
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => {
                    setOwnerEmail(e.target.value);
                    if (ownerError) setOwnerError(null);
                  }}
                  placeholder={t.ownerEmailPlaceholder}
                  className="w-full px-3 py-2.5 bg-white/85 border border-slate-200/90 rounded-xl text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-xs focus:outline-none backdrop-blur-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {t.ownerPassLabel}
                </label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => {
                    setOwnerPassword(e.target.value);
                    if (ownerError) setOwnerError(null);
                  }}
                  placeholder={t.ownerPassPlaceholder}
                  className="w-full px-3 py-2.5 bg-white/85 border border-slate-200/90 rounded-xl text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-xs focus:outline-none backdrop-blur-sm"
                  required
                />
              </div>

              {ownerError && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] leading-tight flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{ownerError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 min-h-[44px] rounded-xl text-white text-xs sm:text-sm font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
              >
                <span>{t.ownerLoginBtn}</span>
              </button>

              <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-center gap-1.5 leading-relaxed">
                <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Authorized cold storage facility manager credentials required for portal access.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
