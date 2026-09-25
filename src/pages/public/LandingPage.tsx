import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '../../context/CMSContext';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Scale,
  Warehouse,
  PhoneCall,
  CloudSun,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ArrowRight,
  Globe,
  Menu,
  X,
  ChevronRight,
  Sprout,
  Headphones,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
  Check,
} from 'lucide-react';

const LANDING_TRANSLATIONS = {
  en: {
    brandTagline: 'Smart Market Linkage & Farmer Advisory Platform',
    navLinks: [
      { label: 'Home', href: '#hero' },
      { label: 'About', href: '#about' },
      { label: 'Farmer Services', href: '#services' },
      { label: 'AI Advisory', href: '#calling-journey' },
      { label: 'Cold Storage', href: '#services' },
      { label: 'Schemes', href: '#services' },
      { label: 'Impact', href: '#statistics' },
      { label: 'Contact', href: '#contact' },
    ],
    loginBtn: 'Login',
    exploreDemoBtn: 'Explore Demo',
    heroLine1: 'Helping Farmers Make the',
    heroLine2: 'Right Move at the Right Time',
    heroDescription:
      'Farmer’s Gamble connects farmers with market prices, crop advisories, weather information, storage opportunities and agricultural support — through one intelligent platform.',
    trustDirectApmc: 'Direct APMC Integration',
    trustZeroBroker: 'Zero Broker Intermediaries',
    trustCertifiedStorage: 'Certified Cold Storage Hubs',
    newsTickerLabel: 'LATEST UPDATES',
    newsItems: [
      '🌾 Mandi prices updated across Maharashtra APMCs',
      '📢 New farmer advisory available',
      '🏪 Cold storage appointment slots available',
      '🌦️ Weather advisory updated for selected regions',
      '📞 Farmer AI calling schedule updated',
    ],
    welcomeMessages: [
      '🌾 Real-time APMC price intelligence and scientific sell-vs-store advisories for higher profits',
      '📞 Free Kisan AI Call Support available across all Maharashtra districts',
      '🏛️ Official Agricultural Decision Support Platform empowering farming communities',
      '🌦️ Live weather forecasts and AI-driven crop advisories across Maharashtra APMCs',
      '🏪 Cold storage appointment slots & verified warehousing available',
    ],
    quickCards: [
      {
        title: 'MARKET PRICES',
        description: 'Track mandi prices and price movements across regional agricultural markets.',
      },
      {
        title: 'AI ADVISORY',
        description: 'Receive personalized farming guidance based on crop, harvest date, and soil.',
      },
      {
        title: 'COLD STORAGE',
        description: 'Find certified storage facilities and request instant space appointments.',
      },
      {
        title: 'FARMER SUPPORT',
        description: 'Report farming problems and get dedicated assistance from Agriculture Officers.',
      },
    ],
    callingBadge: 'Proactive Vernacular Voice Communication',
    callingHeading: 'Your Farm. Your Information. Your Support.',
    callingDescription:
      'Farmer’s Gamble actively reaches out to registered farmers through scheduled telephone calls in Marathi, Hindi, Telugu, and English — delivering personalized weather advisories and mandi opportunities without requiring smartphone apps.',
    callingSteps: [
      { step: '01', title: 'Farmer Enrolled', desc: 'Officially registered by Taluka Agriculture Officer with land, crop, and language preference.' },
      { step: '02', title: 'AI Welcome Call', desc: 'Introductory call confirming crop details and establishing trust in the native dialect.' },
      { step: '03', title: 'Weekly Check-in', desc: 'Scheduled automated phone dialogue checking current crop stage and expected harvest date.' },
      { step: '04', title: 'Problem Detection', desc: 'Natural language understanding identifying distress, pests, or cold storage requirements.' },
      { step: '05', title: 'Market Advisory', desc: 'Real-time proactive voice alert when regional mandi prices reach optimal selling thresholds.' },
      { step: '06', title: 'Officer Escalation', desc: 'Direct escalation to local agriculture officers for physical farm inspections and support.' },
    ],
    servicesBadge: 'End-to-End Decision Architecture',
    servicesHeading: 'Everything a Farmer Needs',
    servicesDescription:
      'Eliminating distress sales through price transparency, scientific preservation models, and immediate government officer escalation.',
    farmerServices: [
      {
        title: 'Mandi Price Intelligence',
        description: 'Live modal, minimum, and maximum rates from 42+ Maharashtra APMCs with automated transport deduction calculations.',
      },
      {
        title: 'Sell vs. Store Decision Engine',
        description: 'Mathematical algorithm comparing spot mandi sales against warehousing costs, moisture loss, and 3-month forecast prices.',
      },
      {
        title: 'Micro Weather Advisory',
        description: 'Taluka-level meteorological predictions with unseasonal rain alerts, pest risk indices, and optimal spraying windows.',
      },
      {
        title: 'Licensed Cold Storage Hubs',
        description: 'Direct space inventory discovery and online appointment booking across certified agricultural cold chains.',
      },
      {
        title: 'Vernacular AI Calling Advisory',
        description: 'Proactive automated voice calls reaching farmers weekly in Marathi, Hindi, Telugu, and English with timely advisories.',
      },
      {
        title: 'Government Schemes & Subsidies',
        description: 'Comprehensive repository of central & state agricultural initiatives with eligibility check and officer assistance.',
      },
    ],
    impactBadge: 'Demonstrated Operational Scale',
    impactHeading: 'Transparent Agricultural Impact',
    impactDescription: 'Real metrics monitored across state APMC mandi corridors and verified storage hubs.',
    impactStats: [
      { value: '6+', label: 'Registered Farmers', sub: 'Benchmark validation cohort' },
      { value: '42+', label: 'APMC Mandis Covered', sub: 'Real-time daily arrivals' },
      { value: '16', label: 'Cold Storage Hubs', sub: 'Certified warehouse facilities' },
      { value: 'AI + Officer', label: 'Multi-tier Support', sub: 'Voice call + farm inspection' },
    ],
  },
  mr: {
    brandTagline: 'स्मार्ट बाजारपेठ जोडणी आणि शेतकरी सल्लागार व्यासपीठ',
    navLinks: [
      { label: 'मुख्यपृष्ठ', href: '#hero' },
      { label: 'माहिती', href: '#about' },
      { label: 'शेतकरी सेवा', href: '#services' },
      { label: 'एआय सल्लागार', href: '#calling-journey' },
      { label: 'शीतगृह सुविधा', href: '#services' },
      { label: 'शासकीय योजना', href: '#services' },
      { label: 'प्रभाव व आकडेवारी', href: '#statistics' },
      { label: 'संपर्क', href: '#contact' },
    ],
    loginBtn: 'लॉगिन',
    exploreDemoBtn: 'डेमो पहा',
    heroLine1: 'शेतकऱ्यांना योग्य वेळी',
    heroLine2: 'योग्य निर्णय घेण्यास साहाय्य',
    heroDescription:
      'फार्मर्स गॅम्बल शेतकऱ्यांना एकाच व्यासपीठावरून थेट बाजारभाव, पीक सल्ला, हवामान अंदाज, शीतगृह साठवणूक आणि कृषी मार्गदर्शन उपलब्ध करून देते.',
    trustDirectApmc: 'थेट कृषी उत्पन्न बाजार समिती (APMC) जोडणी',
    trustZeroBroker: 'दलालांशिवाय थेट व्यवहार',
    trustCertifiedStorage: 'प्रमाणित शीतगृह व गोदाम केंद्रे',
    newsTickerLabel: 'नवीनतम अपडेट्स',
    newsItems: [
      '🌾 महाराष्ट्र कृषी उत्पन्न बाजार समित्यांचे आजचे ताजे बाजारभाव अपडेट',
      '📢 शेतकऱ्यांसाठी नवीन पीक सल्ला उपलब्ध',
      '🏪 शीतगृह साठवणूक नोंदणी स्लॉट्स उपलब्ध',
      '🌦️ निवडक जिल्ह्यांसाठी हवामान इशारा अद्यतनित',
      '📞 शेतकरी एआय कॉलिंग वेळापत्रक अपडेट',
    ],
    welcomeMessages: [
      '🌾 थेट बाजारभाव, विक्री की साठवणूक अचूक सल्ला आणि हवामान अंदाज एकाच छताखाली',
      '📞 सर्व जिल्ह्यांसाठी मोफत शेतकरी एआय व्हॉइस कॉल सुविधा उपलब्ध — आजच नोंदणी करा!',
      '🏛️ शेतकरी सक्षमीकरणासाठी वचनबद्ध अधिकृत शासकीय कृषी निर्णय साहाय्य प्रणाली',
      '🏪 शीतगृह साठवणूक नोंदणी स्लॉट्स आणि आधुनिक गोदाम सुविधा उपलब्ध',
    ],
    quickCards: [
      {
        title: 'बाजारभाव माहिती',
        description: 'प्रादेशिक कृषी बाजारांमधील बाजारभाव आणि चढ-उतारांवर लक्ष ठेवा.',
      },
      {
        title: 'एआय कृषी सल्ला',
        description: 'पीक, काढणीची तारीख आणि जमिनीच्या पोतानुसार वैयक्तिक मार्गदर्शन मिळवा.',
      },
      {
        title: 'शीतगृह साठवणूक',
        description: 'प्रमाणित शीतगृह शोधा आणि त्वरित जागेची नोंदणी करा.',
      },
      {
        title: 'शेतकरी साहाय्यता',
        description: 'शेतीविषयक अडचणींची तक्रार करा आणि कृषी अधिकाऱ्यांकडून साहाय्य मिळवा.',
      },
    ],
    callingBadge: 'मातृभाषेत स्वयंचलित संवाद',
    callingHeading: 'तुमची शेती. तुमची माहिती. तुमचे साहाय्य.',
    callingDescription:
      'फार्मर्स गॅम्बल नोंदणीकृत शेतकऱ्यांशी मराठी, हिंदी, तेलगू आणि इंग्रजीमध्ये स्वयंचलित फोन कॉलद्वारे संपर्क साधून स्मार्टफोनशिवाय अचूक हवामान व बाजार सल्ला पोहोचवते.',
    callingSteps: [
      { step: '01', title: 'शेतकरी नोंदणी', desc: 'तालुका कृषी अधिकाऱ्यांमार्फत जमीन, पीक आणि भाषेच्या पसंतीसह अधिकृत नोंदणी.' },
      { step: '02', title: 'एआय स्वागत कॉल', desc: 'पिकाच्या तपशीलाची खात्री करून स्थानिक बोलीभाषेत शेतकऱ्यांशी परिचय व विश्वास संवाद.' },
      { step: '03', title: 'साप्ताहिक तपासणी', desc: 'पिकाची सद्यस्थिती व संभाव्य काढणीची तारीख जाणून घेण्यासाठी नियमित फोन संवाद.' },
      { step: '04', title: 'समस्या ओळख', desc: 'कीड, रोग किंवा शीतगृहाची गरज ओळखणारी स्वयंचलित नैसर्गिक भाषा समज.' },
      { step: '05', title: 'बाजार सल्ला', desc: 'स्थानिक बाजार समित्यांमध्ये पिकाला सर्वोत्तम भाव मिळाल्यास थेट स्वयंचलित फोन इशारा.' },
      { step: '06', title: 'अधिकारी मार्गदर्शन', desc: 'शेतात प्रत्यक्ष तपासणी व मदतीसाठी स्थानिक कृषी अधिकाऱ्यांकडे थेट वर्ग.' },
    ],
    servicesBadge: 'संपूर्ण शेती निर्णय व्यवस्था',
    servicesHeading: 'शेतकऱ्यांना आवश्यक सर्वकाही',
    servicesDescription:
      'भाव पारदर्शकता, वैज्ञानिक साठवणूक मॉडेल आणि थेट कृषी अधिकारी साहाय्याद्वारे शेतीमालाची घाईघाईत कमी भावात होणारी विक्री रोखणे.',
    farmerServices: [
      {
        title: 'बाजारभाव विश्लेषण',
        description: '४२+ पेक्षा जास्त महाराष्ट्र बाजार समित्यांचे थेट किमान, कमाल व सरासरी दर व वाहतूक खर्च वजावट.',
      },
      {
        title: 'विक्री की साठवणूक निर्णय प्रणाली',
        description: 'गोदाम भाडे, घट आणि ३ महिन्यांच्या अंदाजित भावांची तुलना करून अचूक निर्णय.',
      },
      {
        title: 'हवामान अंदाज व सल्ला',
        description: 'तालुकास्तरीय अचूक हवामान अंदाज, अवकाळी पावसाचा इशारा आणि कीड नियंत्रण सूचना.',
      },
      {
        title: 'प्रमाणित शीतगृह केंद्रे',
        description: 'जवळील प्रमाणित शीतगृहांची थेट माहिती आणि ऑनलाइन जागा आरक्षण.',
      },
      {
        title: 'मातृभाषेत एआय कॉलिंग सल्ला',
        description: 'मराठी, हिंदी व इतर भाषांमध्ये थेट फोन कॉलद्वारे दर आठवड्याला मोफत शेती सल्ला.',
      },
      {
        title: 'शासकीय योजना व अनुदान',
        description: 'केंद्र आणि राज्य शासनाच्या कृषी योजनांची माहिती, पात्रता आणि अधिकारी साहाय्य.',
      },
    ],
    impactBadge: 'ठळक शेतीविषयक कामगिरी',
    impactHeading: 'पारदर्शक कृषी प्रभाव व प्रगती',
    impactDescription: 'राज्यातील प्रमुख बाजार समित्या आणि शीतगृहांच्या नेटवर्कवरून नोंदवलेली खरी आकडेवारी.',
    impactStats: [
      { value: '६+', label: 'नोंदणीकृत शेतकरी', sub: 'प्रायोगिक चाचणी शेतकरी गट' },
      { value: '४२+', label: 'बाजार समित्या जोडल्या', sub: 'दैनंदिन ताजे बाजारभाव अपडेट' },
      { value: '१६', label: 'प्रमाणित शीतगृहे', sub: 'नोंदणीकृत आधुनिक गोदाम केंद्रे' },
      { value: 'एआय + अधिकारी', label: 'द्विस्तरीय साहाय्यता', sub: 'व्हॉइस कॉल + थेट शेती भेट' },
    ],
  },
  hi: {
    brandTagline: 'स्मार्ट बाज़ार जुड़ाव एवं किसान परामर्श प्लेटफ़ॉर्म',
    navLinks: [
      { label: 'होम', href: '#hero' },
      { label: 'परिचय', href: '#about' },
      { label: 'किसान सेवाएं', href: '#services' },
      { label: 'एआई सलाह', href: '#calling-journey' },
      { label: 'शीतगृह', href: '#services' },
      { label: 'सरकारी योजनाएं', href: '#services' },
      { label: 'प्रभाव', href: '#statistics' },
      { label: 'संपर्क', href: '#contact' },
    ],
    loginBtn: 'लॉगिन',
    exploreDemoBtn: 'डेमो देखें',
    heroLine1: 'किसानों को सही समय पर',
    heroLine2: 'सही फैसला लेने में मददगार',
    heroDescription:
      'फार्मर्स गैंबल किसानों को बाज़ार भाव, फसल सलाह, मौसम पूर्वानुमान, शीतगृह भंडारण और कृषि सहायता — एक ही बुद्धिमान प्लेटफ़ॉर्म से जोड़ता है।',
    trustDirectApmc: 'प्रत्यक्ष एपीएमसी (APMC) मंडी एकीकरण',
    trustZeroBroker: 'बिना बिचौलियों के सीधा लाभ',
    trustCertifiedStorage: 'प्रमाणित शीतगृह भंडारण केंद्र',
    newsTickerLabel: 'ताज़ा अपडेट',
    newsItems: [
      '🌾 महाराष्ट्र की एपीएमसी मंडियों के ताज़ा भाव अपडेट किए गए',
      '📢 किसानों के लिए नई फसल एडवाइजरी उपलब्ध',
      '🏪 शीतगृह भंडारण स्लॉट उपलब्ध',
      '🌦️ चयनित क्षेत्रों के लिए मौसम पूर्वानुमान अपडेट',
      '📞 किसान एआई कॉलिंग शेड्यूल अपडेट किया गया',
    ],
    welcomeMessages: [
      '🌾 लाइव मंडी भाव, बिक्री या भंडारण का सही निर्णय और सटीक मौसम पूर्वानुमान एक ही मंच पर',
      '📞 सभी जिलों के किसान भाइयों के लिए निशुल्क एआई वॉयस कॉल सेवा उपलब्ध — आज ही पंजीकरण करें!',
      '🏛️ किसानों के सशक्तिकरण हेतु समर्पित आधिकारिक कृषि निर्णय सहायता प्रणाली',
      '🏪 शीतगृह भंडारण स्लॉट और प्रमाणित गोदाम सुविधाएं उपलब्ध',
    ],
    quickCards: [
      {
        title: 'मंडी भाव',
        description: 'क्षेत्रीय कृषि मंडियों में फसलों के ताज़ा भाव और रुझान देखें।',
      },
      {
        title: 'एआई सलाह',
        description: 'फसल, कटाई की तारीख और मिट्टी के आधार पर व्यक्तिगत कृषि सलाह पाएं।',
      },
      {
        title: 'शीतगृह सुविधा',
        description: 'प्रमाणित भंडारण केंद्र खोजें और त्वरित अपॉइंटमेंट बुक करें।',
      },
      {
        title: 'किसान सहायता',
        description: 'खेती से जुड़ी समस्याएं दर्ज करें और कृषि अधिकारियों से समाधान पाएं।',
      },
    ],
    callingBadge: 'मातृभाषा में सक्रिय संवाद',
    callingHeading: 'आपका खेत। आपकी जानकारी। आपकी सहायता।',
    callingDescription:
      'फार्मर्स गैंबल पंजीकृत किसानों से हिंदी, मराठी, तेलुगु और अंग्रेजी में स्वचालित फोन कॉल करके बिना स्मार्टफोन के मौसम चेतावनी और मंडी अवसर उपलब्ध कराता है।',
    callingSteps: [
      { step: '01', title: 'किसान पंजीकरण', desc: 'तहसील कृषि अधिकारी द्वारा भूमि, फसल और भाषा चयन के साथ आधिकारिक पंजीकरण।' },
      { step: '02', title: 'एआई स्वागत कॉल', desc: 'फसल विवरण की पुष्टि करने और स्थानीय बोली में विश्वास स्थापित करने वाला परिचय कॉल।' },
      { step: '03', title: 'साप्ताहिक संपर्क', desc: 'फसल की वर्तमान स्थिति और कटाई की संभावित तारीख जानने के लिए नियमित फोन संवाद।' },
      { step: '04', title: 'समस्या निवारण', desc: 'कीट, रोग, मौसम या शीतगृह की आवश्यकता को समझने वाली प्राकृतिक भाषा प्रणाली।' },
      { step: '05', title: 'मंडी सलाह', desc: 'स्थानीय मंडियों में फसल का लाभकारी भाव मिलने पर सीधे वॉयस कॉल अलर्ट।' },
      { step: '06', title: 'अधिकारी मार्गदर्शन', desc: 'खेत पर प्रत्यक्ष निरीक्षण व सहायता के लिए स्थानीय कृषि अधिकारियों को सीधे सूचना।' },
    ],
    servicesBadge: 'संपूर्ण कृषि निर्णय प्रणाली',
    servicesHeading: 'किसानों के लिए आवश्यक हर सुविधा',
    servicesDescription:
      'मूल्य पारदर्शिता, वैज्ञानिक भंडारण मॉडल और तत्काल सरकारी अधिकारी सहायता से संकट में औने-पौने दाम पर बिक्री को रोकना।',
    farmerServices: [
      {
        title: 'मंडी भाव विश्लेषण',
        description: 'महाराष्ट्र की ४२+ एपीएमसी मंडियों के लाइव न्यूनतम, अधिकतम और मॉडल भाव व परिवहन लागत कटौती।',
      },
      {
        title: 'बिक्री या भंडारण निर्णय इंजन',
        description: 'भंडारण खर्च, नमी हानि और ३ महीने के पूर्वानुमान की तुलना कर सही फैसला।',
      },
      {
        title: 'मौसम पूर्वानुमान व एडवाइजरी',
        description: 'तालुका स्तर पर मौसम भविष्यवाणी, बेमौसम बारिश का अलर्ट और छिड़काव की सही सलाह।',
      },
      {
        title: 'प्रमाणित शीतगृह केंद्र',
        description: 'लाइसेंसशुदा कोल्ड स्टोरेज में खाली जगह की जानकारी और तुरंत बुकिंग सुविधा।',
      },
      {
        title: 'मातृभाषा में एआई कॉलिंग सेवा',
        description: 'हिंदी, मराठी और स्थानीय भाषाओं में सीधे फोन पर साप्ताहिक कृषि सलाह।',
      },
      {
        title: 'सरकारी योजनाएं व सब्सिडी',
        description: 'केंद्र व राज्य सरकार की कृषि योजनाओं की जानकारी, पात्रता और अधिकारी सहायता।',
      },
    ],
    impactBadge: 'सटीक परिचालन पैमाना',
    impactHeading: 'पारदर्शी कृषि प्रभाव एवं प्रगति',
    impactDescription: 'राज्य के प्रमुख मंडी गलियारों और प्रमाणित भंडारण केंद्रों से जुड़े वास्तविक आंकड़े।',
    impactStats: [
      { value: '६+', label: 'पंजीकृत किसान', sub: 'प्रायोगिक सत्यापन समूह' },
      { value: '४२+', label: 'एपीएमसी मंडियां जोड़ीं', sub: 'दैनिक ताज़ा आवक और भाव' },
      { value: '१६', label: 'शीतगृह केंद्र', sub: 'प्रमाणित आधुनिक गोदाम' },
      { value: 'एआई + अधिकारी', label: 'दोहरा सहायता तंत्र', sub: 'वॉयस कॉल + खेत निरीक्षण' },
    ],
  },
};

const farmerServiceIcons = [TrendingUp, Scale, CloudSun, Warehouse, PhoneCall, FileText];

export const LandingPage: React.FC = () => {
  const { config } = useCMS();
  const { currentLanguage, setLanguage } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active translation dictionary based on currentLanguage
  const langKey = (currentLanguage === 'mr' || currentLanguage === 'hi') ? currentLanguage : 'en';
  const t = LANDING_TRANSLATIONS[langKey];

  const brandName = config.branding.appName || "Farmer's Gamble";
  const brandTagline = (currentLanguage === 'en' && config.branding.tagline)
    ? config.branding.tagline
    : t.brandTagline;

  // Dynamic news items: if English and CMS has custom items, use CMS; otherwise use active language translations
  const activeNewsItems =
    currentLanguage === 'en' && config.landing?.newsItems && config.landing.newsItems.length > 0
      ? config.landing.newsItems
      : t.newsItems;

  // Guarantee continuous infinite marquee track width across all screen resolutions
  const marqueeItems = activeNewsItems.length < 5
    ? [...activeNewsItems, ...activeNewsItems]
    : activeNewsItems;

  // Scroll to hero section automatically when user loads or reloads the page
  useEffect(() => {
    // 1. Force browser not to restore previous scroll position upon reload
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // 2. Clear or reset hash if it points to non-hero anchors on full reload
    if (window.location.hash && window.location.hash !== '#hero' && window.location.hash !== '#herosection') {
      window.history.replaceState(null, '', window.location.pathname + '#hero');
    }

    const scrollToHero = (behavior: ScrollBehavior = 'smooth') => {
      const hero = document.getElementById('hero') || document.getElementById('herosection');
      if (hero) {
        const header = document.querySelector('header');
        const headerHeight = header ? header.getBoundingClientRect().height : 100;
        const elementPosition = hero.getBoundingClientRect().top + window.pageYOffset;
        const targetScroll = Math.max(0, elementPosition - headerHeight);

        window.scrollTo({
          top: targetScroll,
          behavior,
        });
      } else {
        window.scrollTo({ top: 0, behavior });
      }
    };

    // Immediate positioning to avoid jumping
    scrollToHero('auto');

    // Follow-up after dynamic layout rendering and asset paint
    const timer = setTimeout(() => {
      scrollToHero('smooth');
    }, 80);

    const handleBeforeUnload = () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div
      id="home"
      className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white"
      style={{
        backgroundColor: 'var(--color-surface, #FFFDF7)',
      }}
    >
      {/* =================================================================== */}
      {/* MAIN HEADER & BRANDING (with Language Selector near Login)          */}
      {/* =================================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Emblem + Title + Tagline */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div
                  className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-emerald-200/90 shadow-xs shrink-0 group-hover:scale-105 group-hover:border-emerald-500 group-hover:shadow-md transition-all"
                  style={{
                    boxShadow: '0 2px 8px -2px rgba(46, 125, 50, 0.16)',
                  }}
                >
                  <img
                    src="/branding-symbol.png"
                    alt={brandName}
                    className="w-full h-full object-contain select-none"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-extrabold text-lg sm:text-xl tracking-tight leading-none"
                      style={{ color: 'var(--color-primary, #388E3C)' }}
                    >
                      {brandName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium tracking-normal mt-0.5 hidden sm:block">
                    {brandTagline}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right: Public Actions (Language Selector, Explore Demo & Main Login Button) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Selector beside Login */}
              <div
                className="hidden sm:inline-flex items-center gap-0.5 p-0.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--color-background, #FAFAFA)',
                  borderColor: 'var(--color-border, #E0E0E0)',
                }}
              >
                <Globe className="w-3.5 h-3.5 mx-1 shrink-0" style={{ color: 'var(--color-primary, #388E3C)' }} />
                {(['en', 'mr', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                    {lang === 'en' ? 'EN' : lang === 'mr' ? 'मराठी' : 'हिंदी'}
                  </button>
                ))}
              </div>

              <Link
                to="/demo"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-2xs transition-colors border"
                style={{
                  borderColor: 'var(--color-secondary, #1976D2)',
                  color: 'var(--color-secondary, #1976D2)',
                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary, #1976D2)' }} />
                <span>{t.exploreDemoBtn}</span>
              </Link>

              {/* Prominent Login Button Navigating to existing /login */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all touch-manipulation hover:shadow-lg hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
              >
                <span>{t.loginBtn}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Secondary Navigation Bar */}
        <nav className="hidden lg:block bg-slate-50/90 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <ul className="flex items-center gap-1 py-1">
                {t.navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#064E3B] hover:bg-emerald-50 transition-colors inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl px-4 py-4 space-y-3">
            {/* Mobile Language Selector */}
            <div
              className="flex items-center justify-between p-2 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--color-background, #FAFAFA)',
                borderColor: 'var(--color-border, #E0E0E0)',
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Globe className="w-4 h-4" style={{ color: 'var(--color-primary, #388E3C)' }} />
                <span>Language / भाषा</span>
              </div>
              <div className="flex items-center gap-1">
                {(['en', 'mr', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                    {lang === 'en' ? 'EN' : lang === 'mr' ? 'मराठी' : 'हिंदी'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {t.navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-[#064E3B]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <Link
                to="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{t.exploreDemoBtn}</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#064E3B] text-[#F8E7C9] font-bold text-sm shadow-md"
              >
                <span>{t.loginBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* WELCOME NEWS MARQUEE — directly below header                        */}
      {/* =================================================================== */}
      <div
        className="welcome-ticker-container w-full bg-gradient-to-r from-[#064E3B] via-[#065F46] to-[#047857] border-b border-green-900 overflow-hidden"
        style={{ height: '36px' }}
      >
        <div className="flex items-center h-full relative">
          {/* Subtle edge gradient fades */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#064E3B] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#047857] to-transparent pointer-events-none z-10" />

          {/* Scrolling message track */}
          <div className="flex-1 overflow-hidden relative flex items-center h-full">
            <div className="animate-welcome-ticker flex items-center whitespace-nowrap">
              <span className="text-white font-medium text-xs sm:text-[13px] px-12 sm:px-16 select-none">
                Welcome to Farmer’s Gamble — Empowering Farmers with Smart Market Prices, AI Advisory, Weather Insights, Cold Storage, and Timely Agricultural Support.
              </span>
              <span className="text-white font-medium text-xs sm:text-[13px] px-12 sm:px-16 select-none">
                Welcome to Farmer’s Gamble — Empowering Farmers with Smart Market Prices, AI Advisory, Weather Insights, Cold Storage, and Timely Agricultural Support.
              </span>
              <span className="text-white font-medium text-xs sm:text-[13px] px-12 sm:px-16 select-none">
                Welcome to Farmer’s Gamble — Empowering Farmers with Smart Market Prices, AI Advisory, Weather Insights, Cold Storage, and Timely Agricultural Support.
              </span>
              <span className="text-white font-medium text-xs sm:text-[13px] px-12 sm:px-16 select-none">
                Welcome to Farmer’s Gamble — Empowering Farmers with Smart Market Prices, AI Advisory, Weather Insights, Cold Storage, and Timely Agricultural Support.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. LARGE HERO SECTION                                               */}
      {/* =================================================================== */}
      <section
        id="hero"
        data-section="herosection"
        className="relative overflow-hidden bg-gradient-to-b from-[#F8E7C9]/40 via-white to-white pt-6 sm:pt-8 pb-8 sm:pb-10 border-b border-slate-200 scroll-mt-20 lg:scroll-mt-32"
      >
        <span id="herosection" className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none -mt-20 lg:-mt-32" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 text-left">
              {/* Main Heading */}
              <h1
                className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.14]"
                style={{ color: 'var(--color-text-dark, #333333)' }}
              >
                {t.heroLine1} <br className="hidden sm:inline" />
                <span
                  style={{
                    color: 'var(--color-primary, #388E3C)',
                  }}
                >
                  {t.heroLine2}
                </span>
              </h1>

              {/* Supporting Text */}
              <p
                className="text-sm sm:text-base leading-relaxed font-normal max-w-2xl"
                style={{ color: 'var(--color-text-muted, #666666)' }}
              >
                {t.heroDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl text-white font-bold text-sm sm:text-base shadow-md transition-all touch-manipulation hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--color-primary, #388E3C)' }}
                >
                  <span>{t.loginBtn}</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </Link>

                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl border-2 font-bold text-sm sm:text-base shadow-xs transition-colors"
                  style={{
                    borderColor: 'var(--color-secondary, #1976D2)',
                    color: 'var(--color-secondary, #1976D2)',
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                  }}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--color-secondary, #1976D2)' }} />
                  <span>{t.exploreDemoBtn}</span>
                </Link>
              </div>

              {/* Trust & Guarantee Markers */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{t.trustDirectApmc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{t.trustZeroBroker}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{t.trustCertifiedStorage}</span>
                </div>
              </div>
            </div>

            {/* Right Visual: High Quality Agricultural Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#E0C79B] shadow-2xl bg-white">
                
                {/* Farmer Image in Agricultural Field */}
                <div className="relative h-64 sm:h-80 lg:h-[350px] w-full overflow-hidden bg-slate-100">
                  <img
                    src="/images/farmer_hero_visual.jpg"
                    alt="Indian Farmer in Maharashtra onion agricultural field using smart advisory"
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />
                </div>

              </div>
            </div>

          </div>


        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. HERO INFORMATION STRIP (4 COMPACT QUICK-ACCESS CARDS)            */}
      {/* =================================================================== */}
      <section className="relative -mt-5 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Market Prices */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all group">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{t.quickCards[0].title}</h2>
            <p className="text-xs text-slate-600 mt-1 leading-snug">
              {t.quickCards[0].description}
            </p>
          </div>

          {/* Card 2: AI Advisory */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all group">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{t.quickCards[1].title}</h2>
            <p className="text-xs text-slate-600 mt-1 leading-snug">
              {t.quickCards[1].description}
            </p>
          </div>

          {/* Card 3: Cold Storage */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all group">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Warehouse className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{t.quickCards[2].title}</h2>
            <p className="text-xs text-slate-600 mt-1 leading-snug">
              {t.quickCards[2].description}
            </p>
          </div>

          {/* Card 4: Farmer Support */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all group">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{t.quickCards[3].title}</h2>
            <p className="text-xs text-slate-600 mt-1 leading-snug">
              {t.quickCards[3].description}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. AI CALLING JOURNEY SECTION                                       */}
      {/* =================================================================== */}
      <section
        id="calling-journey"
        className="py-10 sm:py-14 relative bg-gradient-to-b from-[#FAFAFA] to-white border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
              <PhoneCall className="w-3.5 h-3.5" style={{ color: '#388E3C' }} />
              <span>{t.callingBadge}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t.callingHeading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.callingDescription}
            </p>
          </div>

          {/* Visual Calling Journey Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {t.callingSteps.map((step) => (
              <div
                key={step.step}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 hover:border-[#388E3C] shadow-xs hover:shadow-md transition-all space-y-2 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xl font-black transition-transform group-hover:scale-105"
                    style={{ color: '#388E3C' }}
                  >
                    {step.step}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'rgba(56, 142, 60, 0.12)', color: '#388E3C' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-[#388E3C] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Audio Technology Note */}
          <div className="mt-6 sm:mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: '#388E3C' }} />
            <span>
              Integrated with Twilio Programmable Voice & AI Journey State Machine. Tested under authentic network conditions.
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 7. FARMER SERVICES SECTION ("Everything a Farmer Needs")            */}
      {/* =================================================================== */}
      <section id="services" className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sprout className="w-3.5 h-3.5" />
            <span>{t.servicesBadge}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.servicesHeading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.servicesDescription}
          </p>
        </div>

        {/* 6 Core Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {t.farmerServices.map((service, idx) => {
            const Icon = farmerServiceIcons[idx] || TrendingUp;
            return (
              <div
                key={service.title}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 hover:border-[#064E3B] shadow-xs hover:shadow-md transition-all space-y-2 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center group-hover:bg-[#064E3B] group-hover:text-[#F8E7C9] transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 8. STATISTICS / IMPACT SECTION                                      */}
      {/* =================================================================== */}
      <section id="statistics" className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-1.5 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <BarChartIcon className="w-3.5 h-3.5" />
            <span>{t.impactBadge}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.impactHeading}
          </h2>
          <p className="text-xs text-slate-600">
            {t.impactDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {t.impactStats.map((stat, idx) => (
            <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black text-[#064E3B] font-mono">{stat.value}</div>
              <div className="text-xs font-bold text-slate-800">{stat.label}</div>
              <div className="text-[11px] text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 10. PROFESSIONAL GOVERNMENT-STYLE FOOTER                            */}
      {/* (STRICTLY NO DEVELOPER / DEVELOPER PORTAL LINK)                    */}
      {/* =================================================================== */}
      <footer
        id="contact"
        className="text-slate-200 border-t-4"
        style={{
          backgroundColor: 'var(--color-text-dark, #333333)',
          borderTopColor: 'var(--color-primary, #388E3C)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-left">
            
            {/* Col 1 & 2: Brand Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-[#E0C79B] shrink-0 shadow-sm">
                  <img
                    src="/branding-symbol.png"
                    alt={brandName}
                    className="w-full h-full object-contain select-none"
                  />
                </div>
                <div>
                  <div className="font-extrabold text-lg text-white tracking-tight leading-none">
                    {brandName}
                  </div>
                  <div className="text-[10px] text-[#F8E7C9]/80 font-medium mt-1">
                    {brandTagline}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Next-generation agricultural decision support system designed to eliminate distress sales and empower Indian farmers through market transparency and cold storage linkage.
              </p>

              <div className="text-xs text-slate-400 space-y-1 font-mono pt-1">
                <div>Kisan Helpline: 1800-180-1551 (Toll Free)</div>
                <div>Krishi Bhavan, Shivaji Nagar, Pune - 411005</div>
              </div>
            </div>

            {/* Col 3: Quick Navigation */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-[#F8E7C9] font-bold">
                Quick Links
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#hero" className="hover:text-white hover:underline transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white hover:underline transition-colors">
                    About Platform
                  </a>
                </li>
                <li>
                  <a href="#market-prices" className="hover:text-white hover:underline transition-colors">
                    Mandi Prices
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white hover:underline transition-colors">
                    Farmer Services
                  </a>
                </li>
                <li>
                  <a href="#calling-journey" className="hover:text-white hover:underline transition-colors">
                    Voice Advisory
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Public Portals (Existing Login Page) */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-[#F8E7C9] font-bold">
                Portals
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="hover:text-white hover:underline transition-colors">
                    Farmer Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white hover:underline transition-colors">
                    System Admin Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white hover:underline transition-colors">
                    Agriculture Officer Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white hover:underline transition-colors">
                    Cold Storage Owner Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/demo"
                    className="text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Explore Judge Demo</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 5: External Verified Resources */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-[#F8E7C9] font-bold">
                Official Resources
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a
                    href="https://agmarknet.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline"
                  >
                    Agmarknet National Portal
                  </a>
                </li>
                <li>
                  <a
                    href="https://krishi.maharashtra.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline"
                  >
                    Dept. of Agriculture MH
                  </a>
                </li>
                <li>
                  <a
                    href="https://enam.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline"
                  >
                    e-NAM Market Hub
                  </a>
                </li>
                <li>
                  <a
                    href="https://mahadbt.maharashtra.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline"
                  >
                    MahaDBT Farmer Schemes
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="mt-12 pt-6 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Designed and devoloped by Hakera _KARE
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>SIH 2024–2026 Evaluation Ready</span>
              <span>•</span>
              <a href="#about" className="hover:text-white">Privacy Policy</a>
              <span>•</span>
              <a href="#about" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Simple helper icon
function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}
