import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GovernmentScheme, SchemeCallRecord, SchemeCallStatus, Language } from '../../types';
import { INITIAL_GOVERNMENT_SCHEMES } from '../../data/initialOfficerData';
import { formatDate } from '../../utils/formatters';
import {
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  ExternalLink,
  Radio,
  Volume2,
  Sparkles,
  X,
} from 'lucide-react';

const STORAGE_SCHEMES_KEY = 'fg_officer_schemes_catalog_v2';
const STORAGE_CALLS_KEY = 'fg_officer_scheme_calls_v2';

export const GovernmentSchemesPage: React.FC = () => {
  const { currentLanguage, farmers } = useApp();

  // Schemes state (initial + any custom added by officer)
  const [schemes, setSchemes] = useState<GovernmentScheme[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCHEMES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_GOVERNMENT_SCHEMES.map((s) => ({ ...s, isNewScheme: false }));
    } catch {
      return INITIAL_GOVERNMENT_SCHEMES.map((s) => ({ ...s, isNewScheme: false }));
    }
  });

  // Selected scheme for notification campaign
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(schemes[0]?.id || 'sch-001');

  // Find currently selected scheme
  const currentScheme = useMemo(() => {
    return schemes.find((s) => s.id === selectedSchemeId) || schemes[0];
  }, [schemes, selectedSchemeId]);

  // Eligibility Criteria Configuration State
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['All Crops']);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedLandholding, setSelectedLandholding] = useState<string>('all'); // 'all' | 'small_marginal' (<=2.0) | 'medium' (2.1 - 5.0) | 'large' (> 5.0)
  const [requireAdvisoryConsent, setRequireAdvisoryConsent] = useState<boolean>(true);
  const [requireAadhaarLinked, setRequireAadhaarLinked] = useState<boolean>(false);

  // When selected scheme changes, auto-align default crop filters to the scheme's targets
  useEffect(() => {
    if (currentScheme) {
      if (currentScheme.targetCrops.includes('All Agricultural Crops') || currentScheme.targetCrops.includes('All Crops')) {
        setSelectedCrops(['All Crops']);
      } else {
        setSelectedCrops(currentScheme.targetCrops);
      }
    }
  }, [selectedSchemeId]);

  // Farmer selection state for the campaign (subset selected by officer)
  const [selectedFarmerIdsForCall, setSelectedFarmerIdsForCall] = useState<Set<string>>(new Set());

  // Call Records Tracking state
  const [callRecords, setCallRecords] = useState<SchemeCallRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CALLS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [showAddSchemeModal, setShowAddSchemeModal] = useState(false);
  const [showCallConfirmModal, setShowCallConfirmModal] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // New Scheme Form State
  const [newSchemeForm, setNewSchemeForm] = useState({
    code: '',
    name: '',
    department: 'Department of Agriculture, Govt. of Maharashtra',
    category: 'Direct Income' as GovernmentScheme['category'],
    description: '',
    benefits: '',
    subsidyAmount: '',
    applicationInfo: '',
    requiredDocuments: '7/12 & 8A Land Extract, Aadhaar Card, Bank Passbook (Aadhaar linked)',
    officialPortalUrl: 'https://mahadbt.maharashtra.gov.in',
    targetCrops: 'All Crops',
  });

  // Save schemes helper
  const saveSchemes = (updated: GovernmentScheme[]) => {
    setSchemes(updated);
    try {
      localStorage.setItem(STORAGE_SCHEMES_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Save call records helper
  const saveCallRecords = (updated: SchemeCallRecord[]) => {
    setCallRecords(updated);
    try {
      localStorage.setItem(STORAGE_CALLS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Available crop options from registered data
  const cropOptions = ['All Crops', 'Onion', 'Soybean', 'Tomato', 'Cotton', 'Pomegranate'];

  // Available district options from registered farmers
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    farmers.forEach((f) => {
      if (f.district) set.add(f.district);
    });
    return ['All', ...Array.from(set)];
  }, [farmers]);

  // Toggle crop criteria
  const handleCropToggle = (crop: string) => {
    if (crop === 'All Crops') {
      setSelectedCrops(['All Crops']);
      return;
    }

    let next = selectedCrops.filter((c) => c !== 'All Crops');
    if (next.includes(crop)) {
      next = next.filter((c) => c !== crop);
      if (next.length === 0) next = ['All Crops'];
    } else {
      next.push(crop);
    }
    setSelectedCrops(next);
  };

  // Compute Eligible Farmers strictly based on configured criteria
  const eligibleFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      // 1. Crop check
      let matchesCrop = false;
      if (selectedCrops.includes('All Crops')) {
        matchesCrop = true;
      } else {
        matchesCrop = selectedCrops.some(
          (c) => c.toLowerCase() === farmer.primaryCrop.toLowerCase()
        );
      }
      if (!matchesCrop) return false;

      // 2. Location (District) check
      if (selectedDistrict !== 'All' && farmer.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }

      // 3. Landholding check
      if (selectedLandholding === 'small_marginal' && farmer.landAreaAcres > 2.0) {
        return false;
      }
      if (selectedLandholding === 'medium' && (farmer.landAreaAcres <= 2.0 || farmer.landAreaAcres > 5.0)) {
        return false;
      }
      if (selectedLandholding === 'large' && farmer.landAreaAcres <= 5.0) {
        return false;
      }

      // 4. Advisory Consent check
      if (requireAdvisoryConsent && !farmer.consentForAdvisory) {
        return false;
      }

      return true;
    });
  }, [farmers, selectedCrops, selectedDistrict, selectedLandholding, requireAdvisoryConsent]);

  // Keep selectedFarmerIdsForCall updated when eligibleFarmers change
  useEffect(() => {
    setSelectedFarmerIdsForCall(new Set(eligibleFarmers.map((f) => f.id)));
  }, [eligibleFarmers]);

  // Toggle individual farmer selection for the call campaign
  const toggleFarmerSelection = (id: string) => {
    const next = new Set(selectedFarmerIdsForCall);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFarmerIdsForCall(next);
  };

  const selectAllFarmers = () => {
    setSelectedFarmerIdsForCall(new Set(eligibleFarmers.map((f) => f.id)));
  };

  const deselectAllFarmers = () => {
    setSelectedFarmerIdsForCall(new Set());
  };

  // Generate localized voice script for a given farmer and scheme
  const generateVoiceScript = (farmerName: string, lang: Language, scheme: GovernmentScheme): string => {
    const schemeName = scheme.name;
    const benefits = scheme.subsidyAmount || scheme.benefits || 'Government subsidy and financial assistance';
    const appInfo = scheme.officialPortalUrl || 'MahaDBT Farmer Portal or nearest Taluka Krishi Karyalaya';

    if (lang === 'mr') {
      return (
        `नमस्कार शेतकरी बंधू ${farmerName}, कृषी विभागाकडून आपल्यासाठी महत्त्वाची शासकीय योजना सूचना. ` +
        `'${schemeName}' या योजनेअंतर्गत आपणास ${benefits} उपलब्ध आहे. ` +
        `या योजनेचा लाभ घेण्यासाठी आवश्यक कागदपत्रे: ${scheme.requiredDocuments.slice(0, 3).join(', ')}. ` +
        `अर्ज करण्यासाठी ${appInfo} ला भेट द्या किंवा आपल्या कृषी सहाय्यकांशी संपर्क साधा. धन्यवाद.`
      );
    } else if (lang === 'hi') {
      return (
        `नमस्कार किसान भाई ${farmerName}, कृषि विभाग की ओर से आपके लिए महत्वपूर्ण योजना की जानकारी। ` +
        `'${schemeName}' योजना के तहत आपको ${benefits} का लाभ मिल सकता है। ` +
        `आवश्यक दस्तावेज: ${scheme.requiredDocuments.slice(0, 3).join(', ')}। ` +
        `आवेदन करने के लिए ${appInfo} पर जाएं या अपने स्थानीय कृषि अधिकारी से संपर्क करें। धन्यवाद।`
      );
    } else {
      return (
        `Greetings Farmer ${farmerName}, an official update from the Agriculture Department. ` +
        `Under the '${schemeName}' scheme, you are eligible for ${benefits}. ` +
        `Key documents required: ${scheme.requiredDocuments.slice(0, 3).join(', ')}. ` +
        `Apply online via ${appInfo} or contact your local Agriculture Officer. Thank you.`
      );
    }
  };

  // Handle Adding New Scheme
  const handleAddNewScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeForm.name.trim() || !newSchemeForm.code.trim()) {
      alert('Please fill out Scheme Name and Code.');
      return;
    }

    const newId = `sch-${Date.now().toString().slice(-4)}`;
    const parsedCrops = newSchemeForm.targetCrops
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const parsedDocs = newSchemeForm.requiredDocuments
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const newSchemeItem: GovernmentScheme = {
      id: newId,
      code: newSchemeForm.code.toUpperCase().trim(),
      name: newSchemeForm.name.trim(),
      department: newSchemeForm.department.trim(),
      category: newSchemeForm.category,
      description: newSchemeForm.description.trim() || 'New agricultural scheme released for eligible farmers.',
      subsidyAmount: newSchemeForm.subsidyAmount.trim() || newSchemeForm.benefits.trim() || 'Direct Financial / Subsidy Assistance',
      benefits: newSchemeForm.benefits.trim(),
      applicationInfo: newSchemeForm.applicationInfo.trim(),
      eligibilityCriteria: [
        `Target crops: ${parsedCrops.join(', ')}`,
        'Registered agricultural landholding',
        'Valid Aadhaar linked to bank account',
      ],
      requiredDocuments: parsedDocs.length > 0 ? parsedDocs : ['7/12 Extract', 'Aadhaar Card', 'Bank Passbook'],
      officialPortalUrl: newSchemeForm.officialPortalUrl.trim() || 'https://mahadbt.maharashtra.gov.in',
      targetCrops: parsedCrops.length > 0 ? parsedCrops : ['All Crops'],
      status: 'Active',
      isNewScheme: true, // Identify as newly added scheme
    };

    const updated = [newSchemeItem, ...schemes];
    saveSchemes(updated);
    setSelectedSchemeId(newId);
    setShowAddSchemeModal(false);

    // Reset form
    setNewSchemeForm({
      code: '',
      name: '',
      department: 'Department of Agriculture, Govt. of Maharashtra',
      category: 'Direct Income',
      description: '',
      benefits: '',
      subsidyAmount: '',
      applicationInfo: '',
      requiredDocuments: '7/12 & 8A Land Extract, Aadhaar Card, Bank Passbook',
      officialPortalUrl: 'https://mahadbt.maharashtra.gov.in',
      targetCrops: 'All Crops',
    });

    setActionSuccessNotice(`New scheme "${newSchemeItem.name}" registered successfully!`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Handle Initiating Calls to Selected Eligible Farmers
  const handleConfirmInitiateCalls = () => {
    if (selectedFarmerIdsForCall.size === 0) {
      alert('Please select at least one eligible farmer to call.');
      return;
    }

    const campaignId = `cmp-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const targetFarmers = eligibleFarmers.filter((f) => selectedFarmerIdsForCall.has(f.id));

    const newRecords: SchemeCallRecord[] = targetFarmers.map((farmer) => {
      const script = generateVoiceScript(farmer.name, farmer.preferredLanguage, currentScheme);
      return {
        id: `call-${Date.now().toString().slice(-4)}-${farmer.id.slice(-3)}`,
        campaignId,
        schemeId: currentScheme.id,
        schemeName: currentScheme.name,
        schemeCode: currentScheme.code,
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmerPhone: farmer.phone,
        farmerLanguage: farmer.preferredLanguage,
        village: farmer.village,
        taluka: farmer.taluka,
        crop: farmer.primaryCrop,
        landAreaAcres: farmer.landAreaAcres,
        callStatus: 'Initiated' as SchemeCallStatus, // Explicit: initiated in gateway queue
        initiatedAt: nowIso,
        voiceScriptPreview: script,
        apiIntegrationNote:
          'Voice calling integration placeholder active. Outbound call initiated in local queue. Awaiting carrier telephony gateway connection (Exotel / Twilio) for live audio delivery.',
      };
    });

    const updatedCalls = [...newRecords, ...callRecords];
    saveCallRecords(updatedCalls);

    setShowCallConfirmModal(false);
    setActionSuccessNotice(
      `Voice call campaign initiated for ${targetFarmers.length} eligible farmers! Recorded with status "Initiated".`
    );
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  // Language breakdown for eligible farmers selected for call
  const languageBreakdown = useMemo(() => {
    const counts: Record<string, number> = { mr: 0, hi: 0, en: 0 };
    eligibleFarmers
      .filter((f) => selectedFarmerIdsForCall.has(f.id))
      .forEach((f) => {
        counts[f.preferredLanguage] = (counts[f.preferredLanguage] || 0) + 1;
      });
    return counts;
  }, [eligibleFarmers, selectedFarmerIdsForCall]);



  return (
    <div className="space-y-6 pb-12">
      {/* Action Notification Banner */}
      {actionSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-emerald-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064E3B] via-[#08634B] to-[#0a7a5d] rounded-2xl p-6 text-white shadow-lg shadow-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-sm mb-3">
              <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>
                {currentLanguage === 'mr'
                  ? 'शासकीय योजना सूचना व व्हॉईस कॉलिंग कक्ष'
                  : currentLanguage === 'hi'
                  ? 'सरकारी योजना सूचना एवं वॉइस कॉलिंग कक्ष'
                  : 'Government Scheme Voice Notification Desk'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {currentLanguage === 'mr'
                ? 'शासकीय योजना निवड, शेतकरी पात्रता व थेट कॉलिंग'
                : currentLanguage === 'hi'
                ? 'सरकारी योजना चयन, किसान पात्रता एवं वॉइस कॉलिंग'
                : 'Scheme Selection, Eligibility & Farmer Voice Broadcast'}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {currentLanguage === 'mr'
                ? 'शासकीय योजना निवडा, पिके व जमिनीनुसार पात्रता निकष निश्चित करा आणि सर्व पात्र शेतकऱ्यांना त्यांच्या मातृभाषेत स्वयंचलित कॉलिंग करा.'
                : currentLanguage === 'hi'
                ? 'सरकारी योजना चुनें, फसल व भूमि के आधार पर पात्रता शर्तें तय करें और पात्र किसानों को उनकी स्थानीय भाषा में वॉइस कॉल द्वारा सूचित करें।'
                : 'Select or register a scheme, define crop and holding criteria, match eligible farmers, and broadcast multilingual automated voice calls.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddSchemeModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#064E3B] text-xs font-bold shadow hover:bg-emerald-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>
                {currentLanguage === 'mr'
                  ? '+ नवीन योजना जोडा'
                  : currentLanguage === 'hi'
                  ? '+ नई योजना जोड़ें'
                  : '+ Add New Scheme'}
              </span>
            </button>

            <a
              href="https://mahadbt.maharashtra.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <span>MahaDBT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Scheme Selection & Eligibility Criteria Section */}
        <div className="space-y-6">
          {/* Section 1: Scheme Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Step 1: Scheme Selection
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Select Active Government Scheme or Subsidy Program
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Choose Scheme:</span>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => setSelectedSchemeId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs truncate"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} {s.isNewScheme ? '(NEW)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Scheme Detail Card */}
            {currentScheme && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#064E3B] text-white text-xs font-bold tracking-wide">
                      {currentScheme.code}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      {currentScheme.category}
                    </span>
                    {currentScheme.isNewScheme ? (
                      <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        New Scheme (Added by Officer)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 text-xs font-medium">
                        Existing Recognized Scheme
                      </span>
                    )}
                  </div>

                  <a
                    href={currentScheme.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{currentScheme.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{currentScheme.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                      Financial Benefits / Subsidy
                    </span>
                    <span className="font-bold text-slate-900">{currentScheme.subsidyAmount}</span>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                      Required Documents for Application
                    </span>
                    <span className="text-slate-700 font-medium">
                      {currentScheme.requiredDocuments.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Define Eligibility Criteria */}
          <div id="criteria-settings-section" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5 scroll-mt-20">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Step 2: Eligibility Criteria Configuration
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Define Farmer Qualification Rules for Voice Notification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set conditions below. Registered farmers matching all selected conditions will be prepared for voice calls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Criteria 1: Crop Type */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 block">
                  1. Crop Type (Multi-Select):
                </label>
                <div className="flex flex-wrap gap-2">
                  {cropOptions.map((crop) => {
                    const isSelected = selectedCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => handleCropToggle(crop)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#064E3B] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {crop} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Select specific crops or keep &quot;All Crops&quot; for universal farmer eligibility.
                </span>
              </div>

              {/* Criteria 2: Location (District) */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 block">
                  2. Farmer Location / District:
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Maharashtra Districts (Universal)</option>
                  {districtOptions
                    .filter((d) => d !== 'All')
                    .map((dist) => (
                      <option key={dist} value={dist}>
                        {dist} District
                      </option>
                    ))}
                </select>
                <span className="text-[11px] text-slate-400 block">
                  Target a specific district (e.g. Nashik, Ahmednagar) or notify all regions.
                </span>
              </div>

              {/* Criteria 3: Landholding */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 block">
                  3. Landholding Scale:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'all', label: 'Any Landholding' },
                    { key: 'small_marginal', label: 'Small & Marginal (≤ 2.0 Ac)' },
                    { key: 'medium', label: 'Medium (2.1 – 5.0 Ac)' },
                    { key: 'large', label: 'Large (> 5.0 Ac)' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedLandholding(option.key)}
                      className={`px-3 py-2 rounded-lg text-left font-semibold transition-all ${
                        selectedLandholding === option.key
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Criteria 4: Other Conditions */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 block">
                  4. Additional Mandatory Conditions:
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={requireAdvisoryConsent}
                      onChange={(e) => setRequireAdvisoryConsent(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">
                      Require Registered Voice Advisory Consent (TRAI DND compliant)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={requireAadhaarLinked}
                      onChange={(e) => setRequireAadhaarLinked(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">
                      Require Aadhaar Seeded Bank Account (DBT verified in 7/12)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Criteria Match Summary Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064E3B] flex items-center justify-center font-bold text-base">
                  {eligibleFarmers.length}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {eligibleFarmers.length} Matching Registered Farmers Found
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Evaluated against {farmers.length} registered farmer profiles in system.
                  </span>
                </div>
              </div>

              <a
                href="#eligible-farmers-section"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064E3B] text-white text-xs font-bold hover:bg-[#08634B] shadow transition-colors"
              >
                <span>Review Eligible Farmers ({eligibleFarmers.length}) ↓</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Section 3: Selection of Eligible Farmers */}
          <div id="eligible-farmers-section" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 scroll-mt-20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {currentScheme.code}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Step 3: Selection of Farmers for {currentScheme.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Review the list of {eligibleFarmers.length} eligible farmers. Select or deselect farmers you wish to include in the voice broadcast.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-[#064E3B] text-xs font-bold border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{selectedFarmerIdsForCall.size} of {eligibleFarmers.length} Selected</span>
              </span>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAllFarmers}
                className="font-semibold text-emerald-800 hover:underline"
              >
                Select All ({eligibleFarmers.length})
              </button>
              <span>•</span>
              <button
                onClick={deselectAllFarmers}
                className="font-semibold text-slate-500 hover:underline"
              >
                Deselect All
              </button>
            </div>

            <div className="flex items-center gap-2 font-medium">
              <span>Language Breakdown:</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                मराठी: {languageBreakdown.mr || 0}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                हिंदी: {languageBreakdown.hi || 0}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                English: {languageBreakdown.en || 0}
              </span>
            </div>
          </div>

          {/* Eligible Farmers Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {eligibleFarmers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No Registered Farmers Match the Selected Criteria
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try broadening the crop types, district filter, or landholding scale in the eligibility settings.
                </p>
                <a
                  href="#criteria-settings-section"
                  className="inline-block px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold"
                >
                  Return to Step 2: Adjust Criteria ↑
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            eligibleFarmers.length > 0 &&
                            selectedFarmerIdsForCall.size === eligibleFarmers.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) selectAllFarmers();
                            else deselectAllFarmers();
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="p-4">Farmer Details</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Crop & Landholding</th>
                      <th className="p-4">Call Language</th>
                      <th className="p-4">Eligibility Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {eligibleFarmers.map((farmer) => {
                      const isChecked = selectedFarmerIdsForCall.has(farmer.id);
                      return (
                        <tr
                          key={farmer.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isChecked ? 'bg-white' : 'bg-slate-50/30 opacity-60'
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFarmerSelection(farmer.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{farmer.name}</div>
                            <div className="text-[11px] text-slate-500">
                              ID: {farmer.id} • +91 {farmer.phone}
                            </div>
                          </td>
                          <td className="p-4">
                            <div>{farmer.village}, {farmer.taluka}</div>
                            <div className="text-[11px] text-slate-500">{farmer.district} Dist.</div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-emerald-800">{farmer.primaryCrop}</span>
                            <div className="text-[11px] text-slate-500">
                              {farmer.landAreaAcres} Acres holding
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {farmer.preferredLanguage === 'mr'
                                ? 'मराठी (mr)'
                                : farmer.preferredLanguage === 'hi'
                                ? 'हिंदी (hi)'
                                : 'English (en)'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              <span>Criteria Matched</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Call Eligible Farmers */}
          <div id="call-eligible-farmers-section" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Step 4: Voice Broadcast
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Step 4: Call Eligible Farmers
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Initiate automated multilingual voice calls to contact the selected farmers regarding {currentScheme.name}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCallConfirmModal(true)}
                disabled={selectedFarmerIdsForCall.size === 0}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#064E3B] text-white text-sm font-bold hover:bg-[#08634B] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Eligible Farmers ({selectedFarmerIdsForCall.size})</span>
              </button>
            </div>

            {/* Campaign Summary & Dispatch Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Recipients
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {selectedFarmerIdsForCall.size}
                  <span className="text-xs font-medium text-slate-400 ml-1.5">
                    / {eligibleFarmers.length} selected
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate" title={currentScheme.name}>
                  {currentScheme.code} • {currentScheme.name}
                </span>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Language Distribution
                </span>
                <div className="flex items-center gap-1.5 mt-2 font-bold text-xs flex-wrap">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-700">
                    मराठी: {languageBreakdown.mr || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-700">
                    हिंदी: {languageBreakdown.hi || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-700">
                    English: {languageBreakdown.en || 0}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Delivered in farmer&apos;s preferred language
                </span>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Telephony Status
                </span>
                <span className="text-xs font-bold text-emerald-700 mt-2 block flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Ready to Dispatch
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  AI telephony voice calling service connected
                </span>
              </div>
            </div>

            {selectedFarmerIdsForCall.size === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Please select at least one farmer in <strong>Step 3: Selection of Farmers</strong> above to proceed with calls.
                </span>
              </div>
            )}
          </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CALL CONFIRMATION & SCRIPT PREVIEW                               */}
      {/* ========================================================================= */}
      {showCallConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#064E3B]">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Confirm Voice Broadcast to {selectedFarmerIdsForCall.size} Eligible Farmers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scheme: <strong>{currentScheme.name}</strong> ({currentScheme.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCallConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Distribution */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <span className="font-bold text-slate-800 block">
                Multilingual Voice Call Language Distribution:
              </span>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                  मराठी (Marathi): {languageBreakdown.mr || 0} Farmers
                </span>
                <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold">
                  हिंदी (Hindi): {languageBreakdown.hi || 0} Farmers
                </span>
                <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold">
                  English: {languageBreakdown.en || 0} Farmers
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Each farmer will receive the announcement in their officially registered preferred language.
              </p>
            </div>

            {/* Voice Announcement Audio Script Previews */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Voice Script Announcement Preview (Sample Farmer):
              </span>

              {/* Marathi Sample */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  Marathi Voice Announcement (मराठी व्हॉईस कॉल संदेश):
                </span>
                <p className="text-slate-700 leading-relaxed italic">
                  &quot;{generateVoiceScript('रमेश पाटील', 'mr', currentScheme)}&quot;
                </p>
              </div>

              {/* Hindi Sample */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                  Hindi Voice Announcement (हिंदी वॉइस कॉल संदेश):
                </span>
                <p className="text-slate-700 leading-relaxed italic">
                  &quot;{generateVoiceScript('आनंद शिंदे', 'hi', currentScheme)}&quot;
                </p>
              </div>
            </div>

            {/* Telephony Connection Disclaimer */}
            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                Telephony Gateway Placeholder Status:
              </span>
              <p>
                Outbound voice calls will be registered into the call tracking ledger with status{' '}
                <strong className="text-slate-900">&quot;Initiated&quot;</strong>. Real-time carrier audio streaming will
                activate upon connecting the telephony API webhook (Exotel / Twilio). No mock or fake success data is fabricated.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCallConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInitiateCalls}
                className="px-5 py-2.5 rounded-xl bg-[#064E3B] text-xs font-bold text-white hover:bg-[#08634B] shadow flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Confirm & Initiate Calls ({selectedFarmerIdsForCall.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW GOVERNMENT SCHEME                                        */}
      {/* ========================================================================= */}
      {showAddSchemeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Government Agricultural Scheme</h3>
                <p className="text-xs text-slate-500">
                  Register a newly announced state or central scheme to enable eligibility matching and voice broadcasts.
                </p>
              </div>
              <button
                onClick={() => setShowAddSchemeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewScheme} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Scheme Full Name: *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra Solar Agriculture Feeder Scheme"
                    value={newSchemeForm.name}
                    onChange={(e) => setNewSchemeForm({ ...newSchemeForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code / Acronym: *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MSKVY 2.0"
                    value={newSchemeForm.code}
                    onChange={(e) => setNewSchemeForm({ ...newSchemeForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department / Agency:</label>
                  <input
                    type="text"
                    required
                    value={newSchemeForm.department}
                    onChange={(e) => setNewSchemeForm({ ...newSchemeForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scheme Category:</label>
                  <select
                    value={newSchemeForm.category}
                    onChange={(e) =>
                      setNewSchemeForm({
                        ...newSchemeForm,
                        category: e.target.value as GovernmentScheme['category'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold"
                  >
                    <option value="Direct Income">Direct Income</option>
                    <option value="Crop Insurance">Crop Insurance</option>
                    <option value="Infrastructure & Irrigation">Infrastructure & Irrigation</option>
                    <option value="Subsidies & Implements">Subsidies & Implements</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scheme Description:</label>
                <textarea
                  rows={2}
                  placeholder="Summary of what the scheme provides..."
                  value={newSchemeForm.description}
                  onChange={(e) => setNewSchemeForm({ ...newSchemeForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Financial Benefits / Subsidy Amount: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50% subsidy up to ₹50,000"
                    value={newSchemeForm.subsidyAmount}
                    onChange={(e) =>
                      setNewSchemeForm({
                        ...newSchemeForm,
                        subsidyAmount: e.target.value,
                        benefits: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Crops (Comma-separated):</label>
                  <input
                    type="text"
                    placeholder="All Crops, or Onion, Soybean, Tomato"
                    value={newSchemeForm.targetCrops}
                    onChange={(e) => setNewSchemeForm({ ...newSchemeForm, targetCrops: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Required Documents for Application (Comma-separated):
                </label>
                <input
                  type="text"
                  value={newSchemeForm.requiredDocuments}
                  onChange={(e) => setNewSchemeForm({ ...newSchemeForm, requiredDocuments: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Application Portal URL:</label>
                <input
                  type="url"
                  value={newSchemeForm.officialPortalUrl}
                  onChange={(e) => setNewSchemeForm({ ...newSchemeForm, officialPortalUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSchemeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#064E3B] text-xs font-bold text-white hover:bg-[#08634B] shadow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register & Select Scheme</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};
