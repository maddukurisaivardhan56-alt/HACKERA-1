export type Language = 'en' | 'mr' | 'hi' | 'te';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    mr: string;
    hi: string;
    te?: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Brand & Slogan
  appName: {
    en: "Farmer's Gamble",
    mr: "फार्मर्स गॅम्बल (Farmer's Gamble)",
    hi: "फार्मर्स गैंबल (Farmer's Gamble)",
  },
  appTagline: {
    en: "AI-Assisted Mandi Price & Cold-Storage Intelligence",
    mr: "एआय-समर्थित बाजारभाव आणि शीतगृह निर्णय साहाय्य",
    hi: "एआई-सक्षम मंडी भाव और शीतगृह निर्णय सहायता",
  },
  sihBadge: {
    en: "Agricultural Market Intelligence Platform",
    mr: "कृषी बाजार बुद्धिमत्ता प्रणाली",
    hi: "कृषि मंडी बुद्धिमत्ता प्लेटफ़ॉर्म",
  },

  // Navigation Links
  navDashboard: {
    en: "Farmer Dashboard",
    mr: "शेतकरी डॅशबोर्ड",
    hi: "किसान डैशबोर्ड",
  },
  navMandis: {
    en: "Mandi Price Comparison",
    mr: "बाजारभाव तुलना",
    hi: "मंडी भाव तुलना",
  },
  navSellOrStore: {
    en: "Sell-or-Store Decision",
    mr: "विक्री की साठवणूक निर्णय",
    hi: "बिक्री या भंडारण निर्णय",
  },
  navColdStorage: {
    en: "Cold-Storage Facilities",
    mr: "शीतगृह व गोदामे",
    hi: "शीतगृह एवं गोदाम",
  },
  navAdvisories: {
    en: "Advisory & Call History",
    mr: "सल्लागार व कॉल इतिहास",
    hi: "सलाह एवं कॉल इतिहास",
  },
  navAdminOverview: {
    en: "Admin Overview",
    mr: "प्रशासक आढावा",
    hi: "व्यवस्थापक अवलोकन",
  },
  navCallingDashboard: {
    en: "AI Calling Dashboard",
    mr: "एआय शेतकरी कॉलिंग डॅशबोर्ड",
    hi: "एआई किसान कॉलिंग डैशबोर्ड",
  },
  navFarmerSupport: {
    en: "Farmer Support",
    mr: "शेतकरी साहाय्यता",
    hi: "किसान सहायता",
  },
  navMarketPriceInfo: {
    en: "Market & Price Info",
    mr: "बाजार व भाव माहिती",
    hi: "मंडी व भाव जानकारी",
  },
  navGovernmentSchemes: {
    en: "Government Schemes",
    mr: "शासकीय योजना",
    hi: "सरकारी योजनाएं",
  },
  navFieldInspections: {
    en: "Field Inspection & Monitoring",
    mr: "शेत तपासणी व पाहणी",
    hi: "खेत निरीक्षण एवं निगरानी",
  },
  navFarmerRegistry: {
    en: "Farmer Registry",
    mr: "शेतकरी नोंदवही",
    hi: "किसान पंजीयन",
  },
  navMarketData: {
    en: "Mandi & Storage Data",
    mr: "बाजार व शीतगृह माहिती",
    hi: "मंडी व भंडारण डेटा",
  },
  navEventTriggers: {
    en: "Event Triggers & AI Calling",
    mr: "इव्हेंट ट्रिगर व एआय कॉलिंग",
    hi: "इवेंट ट्रिगर व एआई कॉलिंग",
  },
  navEnterPrototype: {
    en: "Enter Platform →",
    mr: "प्लॅटफॉर्मवर जा →",
    hi: "प्लेटफ़ॉर्म पर जाएं →",
  },
  navAdminView: {
    en: "Admin View",
    mr: "प्रशासक दृश्य",
    hi: "व्यवस्थापक दृश्य",
  },
  navFarmerView: {
    en: "Farmer View",
    mr: "शेतकरी दृश्य",
    hi: "किसान दृश्य",
  },
  navResetSeed: {
    en: "Reset Data",
    mr: "डेटा रीसेट करा",
    hi: "डेटा रीसेट करें",
  },
  navLogin: {
    en: "Login",
    mr: "लॉगिन",
    hi: "लॉगिन",
  },

  // Hero Section
  heroTitle1: {
    en: "Make informed selling decisions.",
    mr: "विक्रीचा विचारपूर्वक निर्णय घ्या.",
    hi: "बिक्री का सोच-समझकर निर्णय लें।",
  },
  heroTitle2: {
    en: "Every harvest matters.",
    mr: "प्रत्येक पीक मोलाचे आहे.",
    hi: "हर फसल अनमोल है।",
  },
  heroSubtitle: {
    en: "Compare mandi prices, explore nearby cold-storage options, and understand the real costs of storing your harvest before deciding when to sell.",
    mr: "बाजारभाव तपासा, जवळील शीतगृहांची माहिती मिळवा आणि विक्री करण्यापूर्वी साठवणुकीच्या खर्चाचे अचूक गणित समजून घ्या.",
    hi: "मंडी भावों की तुलना करें, निकटतम शीतगृह खोजें और अपनी उपज बेचने से पहले भंडारण की वास्तविक लागत को समझें।",
  },
  heroExploreBtn: {
    en: "Explore Platform",
    mr: "प्लॅटफॉर्म एक्सप्लोर करा",
    hi: "प्लेटफ़ॉर्म देखें",
  },
  heroLoginBtn: {
    en: "Portal Login",
    mr: "पोर्टल लॉगिन",
    hi: "पोर्टल लॉगिन",
  },

  // Farmer Profile & Switcher
  activeProfile: {
    en: "Active Profile",
    mr: "सक्रिय प्रोफाइल",
    hi: "सक्रिय प्रोफ़ाइल",
  },
  primaryCrop: {
    en: "Primary Crop",
    mr: "मुख्य पीक",
    hi: "मुख्य फसल",
  },
  landArea: {
    en: "Land Area",
    mr: "जमीन क्षेत्र",
    hi: "भूमि क्षेत्र",
  },
  acres: {
    en: "Acres",
    mr: "एकर",
    hi: "एकड़",
  },
  estimatedYield: {
    en: "Estimated Yield",
    mr: "अपेक्षित उत्पादन",
    hi: "अनुमानित उत्पादन",
  },
  language: {
    en: "Language",
    mr: "भाषा",
    hi: "भाषा",
  },
  marathi: {
    en: "Marathi",
    mr: "मराठी",
    hi: "मराठी",
  },
  hindi: {
    en: "Hindi",
    mr: "हिंदी",
    hi: "हिंदी",
  },
  english: {
    en: "English",
    mr: "इंग्रजी",
    hi: "अंग्रेज़ी",
  },

  // Metric Cards
  currentMandiPrice: {
    en: "Current Mandi Price",
    mr: "सध्याचा बाजारभाव",
    hi: "वर्तमान मंडी भाव",
  },
  immediateSellValue: {
    en: "Immediate Sell Value",
    mr: "त्वरित विक्री मूल्य",
    hi: "तत्काल बिक्री मूल्य",
  },
  storedNetPotential: {
    en: "3-Mo Stored Net Potential",
    mr: "३ महिने साठवणूक निव्वळ क्षमता",
    hi: "3 माह भंडारण शुद्ध क्षमता",
  },
  breakEvenThreshold: {
    en: "Break-Even Threshold",
    mr: "ब्रेक-इव्हन भाव मर्यादा",
    hi: "ब्रेक-ईवन भाव सीमा",
  },

  // Common Actions & Badges
  getDirections: {
    en: "Get Directions",
    mr: "नकाशा / दिशानिर्देश",
    hi: "दिशा-निर्देश प्राप्त करें",
  },
  sendEnquiry: {
    en: "Send Storage Enquiry",
    mr: "साठवणूक चौकशी पाठवा",
    hi: "भंडारण पूछताछ भेजें",
  },
  simulateCall: {
    en: "Simulate Voice Call",
    mr: "व्हॉईस कॉल सिम्युलेट करा",
    hi: "वॉइस कॉल सिमुलेट करें",
  },
  viewDecisionAnalysis: {
    en: "View Decision Analysis →",
    mr: "निर्णय विश्लेषण पहा →",
    hi: "निर्णय विश्लेषण देखें →",
  },
  allFacilities: {
    en: "All Facilities →",
    mr: "सर्व शीतगृहे पहा →",
    hi: "सभी शीतगृह देखें →",
  },
  fullMandiTable: {
    en: "Full Mandi Table →",
    mr: "संपूर्ण बाजारभाव तक्ता →",
    hi: "पूरी मंडी तालिका →",
  },
  done: {
    en: "Done",
    mr: "पूर्ण",
    hi: "पूर्ण",
  },
  cancel: {
    en: "Cancel",
    mr: "रद्द करा",
    hi: "रद्द करें",
  },
  submit: {
    en: "Submit",
    mr: "सबमिट करा",
    hi: "सबमिट करें",
  },
  prototypeBadge: {
    en: "INDICATIVE DATA",
    mr: "सूचक माहिती",
    hi: "संकेतक डेटा",
  },

  // Sell-or-Store Calculator
  sellOrStoreTitle: {
    en: "Sell-or-Store Financial Decision Analysis",
    mr: "विक्री की साठवणूक आर्थिक निर्णय विश्लेषण",
    hi: "बिक्री या भंडारण वित्तीय निर्णय विश्लेषण",
  },
  decisionVariables: {
    en: "Decision Variables",
    mr: "निर्णयाचे घटक",
    hi: "निर्णय के घटक",
  },
  quantityQuintals: {
    en: "Quantity (Quintals)",
    mr: "प्रमाण (क्विंटल)",
    hi: "मात्रा (क्विंटल)",
  },
  currentPricePerQtl: {
    en: "Current Mandi Price (₹/Qtl)",
    mr: "सध्याचा बाजारभाव (₹/क्विंटल)",
    hi: "वर्तमान मंडी भाव (₹/क्विंटल)",
  },
  expectedFuturePrice: {
    en: "Expected Future Price (₹/Qtl)",
    mr: "अपेक्षित भावी भाव (₹/क्विंटल)",
    hi: "अपेक्षित भावी भाव (₹/क्विंटल)",
  },
  storageDuration: {
    en: "Storage Holding Duration",
    mr: "साठवणूक कालावधी",
    hi: "भंडारण अवधि",
  },
  months: {
    en: "Months",
    mr: "महिन्यांसाठी",
    hi: "महीने",
  },
  monthlyRent: {
    en: "Monthly Rent (₹/Qtl/Mo)",
    mr: "मासिक भाडे (₹/क्विं/महिना)",
    hi: "मासिक किराया (₹/क्विं/माह)",
  },
  freightToFacility: {
    en: "Freight to Facility (₹/Qtl)",
    mr: "शीतगृहापर्यंत वाहतूक खर्च (₹/क्विं)",
    hi: "शीतगृह तक परिवहन खर्च (₹/क्विं)",
  },
  handlingFee: {
    en: "Handling & Loading (₹/Qtl)",
    mr: "हमाली व हाताळणी (₹/क्विं)",
    hi: "हमाली व लोडिंग (₹/क्विं)",
  },
  shrinkageLoss: {
    en: "Moisture/Shrinkage Loss (%)",
    mr: "वजन/ओलावा घट (%)",
    hi: "वजन/नमी घट (%)",
  },
  scenarioASellNow: {
    en: "Scenario A: Sell Today",
    mr: "पर्याय अ: आजच विक्री करा",
    hi: "विकल्प अ: आज ही बेचें",
  },
  scenarioBStore: {
    en: "Scenario B: Store & Sell Later",
    mr: "पर्याय ब: साठवणूक करून नंतर विका",
    hi: "विकल्प ब: भंडारण कर बाद में बेचें",
  },
  netCashInHand: {
    en: "Net Cash Realization",
    mr: "निव्वळ हातात मिळणारी रक्कम",
    hi: "शुद्ध हाथ में मिलने वाली राशि",
  },
  carryingCosts: {
    en: "Total Storage & Carrying Cost",
    mr: "एकूण साठवणूक व अनुषंगिक खर्च",
    hi: "कुल भंडारण एवं वहन खर्च",
  },
  recommendedStrategy: {
    en: "Recommended Strategy",
    mr: "शिफारस केलेली रणनीती",
    hi: "अनुशंसित रणनीति",
  },
  storeAndWait: {
    en: "STORE & SELL LATER",
    mr: "साठवणूक करा व नंतर विका",
    hi: "भंडारण करें व बाद में बेचें",
  },
  sellNow: {
    en: "SELL NOW AT LOCAL MANDI",
    mr: "सध्याच्या बाजारात त्वरित विका",
    hi: "स्थानीय मंडी में अभी बेचें",
  },

  // Cold Storage Directory
  coldStorageTitle: {
    en: "Cold-Storage & Warehouse Facilities",
    mr: "शीतगृह व गोदाम सुविधा",
    hi: "शीतगृह एवं गोदाम सुविधाएं",
  },
  coldStorageSubtitle: {
    en: "Search accredited preservation facilities in Maharashtra with transparent rental rates and real location directions.",
    mr: "पारदर्शक भाडे दर आणि अचूक नकाशा दिशानिर्देशांसह महाराष्ट्रातील अधिकृत शीतगृहे शोधा.",
    hi: "पारदर्शी किराये और वास्तविक मानचित्र दिशा-निर्देशों के साथ महाराष्ट्र के मान्यता प्राप्त शीतगृह खोजें।",
  },
  freeSpace: {
    en: "Free Space",
    mr: "उपलब्ध क्षमता",
    hi: "उपलब्ध क्षमता",
  },
  distance: {
    en: "Distance",
    mr: "अंतर",
    hi: "दूरी",
  },
  featuresAndControls: {
    en: "Features & Quality Controls",
    mr: "वैशिष्ट्ये व गुणवत्ता नियंत्रणे",
    hi: "विशेषताएं एवं गुणवत्ता नियंत्रण",
  },

  // Mandi Comparison
  mandiComparisonTitle: {
    en: "Mandi Price Discovery & Comparison",
    mr: "बाजारभाव शोध व तुलना",
    hi: "मंडी भाव खोज एवं तुलना",
  },
  commodity: {
    en: "Commodity / Crop",
    mr: "शेतमाल / पीक",
    hi: "कृषि उपज / फसल",
  },
  district: {
    en: "District",
    mr: "जिल्हा",
    hi: "जिला",
  },
  market: {
    en: "Market / APMC",
    mr: "बाजार समिती / मार्केट",
    hi: "मंडी / बाज़ार समिति",
  },
  modalPrice: {
    en: "Modal Price",
    mr: "सरासरी भाव",
    hi: "मॉडल भाव",
  },
  minMaxRange: {
    en: "Min - Max Range",
    mr: "किमान - कमाल दर",
    hi: "न्यूनतम - अधिकतम दर",
  },
  arrivals: {
    en: "Arrivals",
    mr: "आवक",
    hi: "आवक",
  },
  trend7d: {
    en: "7d Trend",
    mr: "७ दिवसांचा कल",
    hi: "7 दिनों का रुझान",
  },

  // Advisory & Voice
  advisoryTitle: {
    en: "Advisory & Automated Call History",
    mr: "सल्लागार व स्वयंचलित कॉल इतिहास",
    hi: "सलाह एवं स्वचालित कॉल इतिहास",
  },
  listenAudio: {
    en: "AI Voice Advisory Audio",
    mr: "एआय व्हॉईस सल्लागार ऑडिओ",
    hi: "एआई वॉइस सलाहकार ऑडियो",
  },
  clickToListen: {
    en: "Click to listen in Marathi, Hindi, or English",
    mr: "मराठी, हिंदी किंवा इंग्रजीमध्ये ऐकण्यासाठी क्लिक करा",
    hi: "मराठी, हिंदी या अंग्रेज़ी में सुनने के लिए क्लिक करें",
  },
  callStatus: {
    en: "Call Status",
    mr: "कॉल स्थिती",
    hi: "कॉल स्थिति",
  },
  completed: {
    en: "Completed & Acknowledged",
    mr: "पूर्ण आणि नोंदवले गेले",
    hi: "पूर्ण और स्वीकृत",
  },

  // Login Page
  signInTitle: {
    en: "Sign In to Farmer's Gamble",
    mr: "फार्मर्स गॅम्बलमध्ये साइन इन करा",
    hi: "फार्मर्स गैंबल में साइन इन करें",
  },
  farmerLoginTab: {
    en: "Farmer Login",
    mr: "शेतकरी लॉगिन",
    hi: "किसान लॉगिन",
  },
  adminLoginTab: {
    en: "Admin Login",
    mr: "प्रशासक लॉगिन",
    hi: "व्यवस्थापक लॉगिन",
  },
  mobileNumber: {
    en: "Mobile Number (+91 India)",
    mr: "मोबाईल नंबर (+91 भारत)",
    hi: "मोबाइल नंबर (+91 भारत)",
  },
  enterOtp: {
    en: "Enter 6-digit OTP",
    mr: "६ अंकी ओटीपी टाका",
    hi: "6 अंकों का ओटीपी दर्ज करें",
  },
  requestOtpBtn: {
    en: "Request Simulated OTP",
    mr: "सिम्युलेटेड ओटीपी मागवा",
    hi: "सिमुलेटेड ओटीपी प्राप्त करें",
  },
  verifyAndEnterBtn: {
    en: "Verify & Enter Portal →",
    mr: "पडताळणी करा व प्रवेश करा →",
    hi: "सत्यापित करें और प्रवेश करें →",
  },
  adminEmail: {
    en: "Admin Work Email",
    mr: "प्रशासकीय ईमेल",
    hi: "व्यवस्थापकीय ईमेल",
  },
  password: {
    en: "Password",
    mr: "पासवर्ड",
    hi: "पासवर्ड",
  },
  enterAdminConsole: {
    en: "Enter Admin Console",
    mr: "प्रशासक कन्सोलमध्ये प्रवेश करा",
    hi: "व्यवस्थापक कंसोल में प्रवेश करें",
  },
  otpSimulatedNotice: {
    en: "Prototype mode: OTP verification is simulated locally for evaluation.",
    mr: "प्रोटोटाइप मोड: मूल्यमापनासाठी ओटीपी पडताळणी स्थानिक पातळीवर सिम्युलेट केली आहे.",
    hi: "प्रोटोटाइप मोड: मूल्यांकन के लिए ओटीपी सत्यापन स्थानीय रूप से सिमुलेट किया गया है।",
  },

  // Advisory History Page
  advisoryPageTitle: {
    en: "Advisory & Automated Call History",
    mr: "सल्लागार व स्वयंचलित कॉल इतिहास",
    hi: "सलाह एवं स्वचालित कॉल इतिहास",
  },
  advisoryPageSubtitle: {
    en: "Review automated market price triggers, storage advisories, and listen to AI voice scripts in Marathi, Hindi, or English.",
    mr: "स्वयंचलित बाजारभाव ट्रिगर, साठवणूक सल्ले तपासा आणि मराठी, हिंदी किंवा इंग्रजीमध्ये एआय व्हॉइस स्क्रिप्ट ऐका.",
    hi: "स्वचालित मंडी भाव ट्रिगर, भंडारण सलाह देखें और मराठी, हिंदी या अंग्रेजी में एआई वॉयस स्क्रिप्ट सुनें।",
  },
  voiceTelephonyNoticeTitle: {
    en: "Voice Telephony Simulation Engine",
    mr: "व्हॉइस टेलिफोनी सिम्युलेशन इंजिन",
    hi: "वॉयस टेलीफोनी सिमुलेशन इंजन",
  },
  voiceTelephonyNoticeMsg: {
    en: "Calls listed in this log represent simulated Exotel IVR automated dispatches triggered by market price movements. You can test speech playback in Marathi, Hindi, or English directly on any card.",
    mr: "या सूचीतील कॉल्स बाजारभावातील हालचालींमुळे सुरू झालेले सिम्युलेटेड एक्झोटेल आयव्हीआर स्वयंचलित कॉल दर्शवतात. आपण कोणत्याही कार्डवर थेट मराठी, हिंदी किंवा इंग्रजीमध्ये ऑडिओ ऐकू शकता.",
    hi: "इस सूची के कॉल बाज़ार भाव के उतार-चढ़ाव से प्रेरित सिम्युलेटेड एक्सोटेल आईवीआर स्वचालित कॉल दर्शाते हैं। आप किसी भी कार्ड पर मराठी, हिंदी या अंग्रेजी में ऑडियो सुन सकते हैं।",
  },
  filterByCrop: {
    en: "Filter by Crop",
    mr: "पिकानुसार फिल्टर",
    hi: "फसल अनुसार फ़िल्टर",
  },
  allCrops: {
    en: "All Crops",
    mr: "सर्व पिके",
    hi: "सभी फसलें",
  },
  allStatuses: {
    en: "All Statuses",
    mr: "सर्व स्थिती",
    hi: "सभी स्थितियां",
  },
  completedAndAck: {
    en: "Completed & Acknowledged",
    mr: "पूर्ण आणि स्वीकृत",
    hi: "पूर्ण और स्वीकृत",
  },
  scheduledStatus: {
    en: "Scheduled",
    mr: "नियोजित",
    hi: "शेड्यूल किया गया",
  },
  matchingRecords: {
    en: "Matching Records",
    mr: "मिळतेजुळते रेकॉर्ड",
    hi: "मिलते-जुलते रिकॉर्ड",
  },
  voiceAdvisoriesLogged: {
    en: "Voice Advisories Logged",
    mr: "नोंदवलेले व्हॉइस सल्ले",
    hi: "दर्ज की गई वॉयस सलाह",
  },

  // Admin Dashboard & Registry
  adminDashboardTitle: {
    en: "Platform Administration & Market Operations",
    mr: "प्लॅटफॉर्म प्रशासन आणि बाजार कामकाज",
    hi: "प्लेटफ़ॉर्म प्रशासन और मंडी संचालन",
  },
  adminDashboardSubtitle: {
    en: "System overview for Maharashtra APMC linkages, storage capacities, and automated voice advisory pipeline.",
    mr: "महाराष्ट्र एपीएमसी बाजार, शीतगृह क्षमता आणि स्वयंचलित व्हॉइस सल्ला पाइपलाइनचा प्रणाली आढावा.",
    hi: "महाराष्ट्र एपीएमसी मंडियों, शीतगृह क्षमता और स्वचालित वॉयस सलाह प्रणाली का संपूर्ण अवलोकन।",
  },
  eventCallMonitorBtn: {
    en: "Event & Calling Monitor",
    mr: "इव्हेंट व कॉलिंग मॉनिटर",
    hi: "इवेंट और कॉलिंग मॉनिटर",
  },
  adminNoticeTitle: {
    en: "Prototype Governance Console",
    mr: "प्रोटोटाइप प्रशासकीय कन्सोल",
    hi: "प्रोटोटाइप प्रशासनिक कंसोल",
  },
  adminNoticeMsg: {
    en: "All administrative records, farmer directories, and telephony logs are maintained in local storage. No private external database or live telecom trunk is connected.",
    mr: "सर्व प्रशासकीय नोंदी, शेतकरी डिरेक्टरी आणि टेलिफोनी लॉग स्थानिक पातळीवर सुरक्षित आहेत.",
    hi: "सभी प्रशासनिक रिकॉर्ड, किसान डायरेक्टरी और टेलीफोनी लॉग स्थानीय स्तर पर सुरक्षित हैं।",
  },
  registeredFarmersTitle: {
    en: "Registered Farmer Records",
    mr: "नोंदणीकृत शेतकरी नोंदी",
    hi: "पंजीकृत किसान रिकॉर्ड",
  },
  registeredProducersSub: {
    en: "Registered producer profiles",
    mr: "नोंदणीकृत शेतकरी प्रोफाईल",
    hi: "पंजीकृत उत्पादक प्रोफ़ाइल",
  },
  activeMandiFeedsTitle: {
    en: "Active Mandi Feeds",
    mr: "सक्रिय बाजारभाव माहिती",
    hi: "सक्रिय मंडी डेटा",
  },
  maharashtraApmcSub: {
    en: "Maharashtra APMC markets",
    mr: "महाराष्ट्र एपीएमसी बाजार",
    hi: "महाराष्ट्र एपीएमसी मंडियां",
  },
  coldChainFreeSpaceTitle: {
    en: "Cold Chain Free Space",
    mr: "शीतगृहातील उपलब्ध जागा",
    hi: "शीतगृह में उपलब्ध स्थान",
  },
  automatedEventRulesTitle: {
    en: "Automated Event Rules",
    mr: "स्वयंचलित इव्हेंट नियम",
    hi: "स्वचालित इवेंट नियम",
  },
  recentVoiceDispatches: {
    en: "Recent AI Voice Advisory Dispatches",
    mr: "नुकतेच पाठवलेले एआय व्हॉइस सल्ले",
    hi: "हाल ही में भेजे गए एआई वॉयस सलाह",
  },
  farmerRegistrySummary: {
    en: "Farmer Registry Summary",
    mr: "शेतकरी नोंदवही सारांश",
    hi: "किसान पंजीयन सारांश",
  },
  manageFarmers: {
    en: "Manage Farmers →",
    mr: "शेतकरी व्यवस्थापन →",
    hi: "किसान प्रबंधन →",
  },
  addFarmerBtn: {
    en: "Add Farmer Profile",
    mr: "नवीन शेतकरी जोडा",
    hi: "नया किसान जोड़ें",
  },

  // Footer & Notices
  footerRights: {
    en: "© 2026 Farmer's Gamble",
    mr: "© 2026 फार्मर्स गॅम्बल",
    hi: "© 2026 फार्मर्स गैंबल",
  },
  footerDesc: {
    en: "Strengthening Market Linkages and Price Discovery for Farmers",
    mr: "शेतकऱ्यांसाठी बाजारपेठ जोडणी आणि भाव शोध प्रणालीचे सक्षमीकरण",
    hi: "किसानों के लिए बाज़ार जुड़ाव और मूल्य खोज प्रणाली का सशक्तिकरण",
  },
};

export function getTranslation(key: string, lang: Language = 'en', fallback?: string): string {
  if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
    return TRANSLATIONS[key][lang];
  }
  return fallback || key;
}
