import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { calculateSellOrStoreDecision } from '../../utils/sellOrStoreCalc';
import { formatINR, formatDateTime } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import { AudioPlayerWidget } from '../../components/advisory/AudioPlayerWidget';
import { SimulatedCallModal } from '../../components/advisory/SimulatedCallModal';
import {
  TrendingUp,
  Scale,
  Warehouse,
  MapPin,
  Layers,
  Sparkles,
  Phone,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';
import { AdvisoryRecord, FarmerSupportRequest } from '../../types';
import { INITIAL_SUPPORT_REQUESTS } from '../../data/initialOfficerData';

export const FarmerDashboard: React.FC = () => {
  const {
    activeFarmer,
    isLoadingFarmer,
    farmerProfileError,
    refreshFarmerProfile,
    mandis,
    storageFacilities,
    advisories,
    t,
    currentLanguage,
  } = useApp();

  const [activeCallModalAdvisory, setActiveCallModalAdvisory] = useState<AdvisoryRecord | null>(null);

  // Problem Reporting Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [problemSubject, setProblemSubject] = useState('');
  const [problemCategory, setProblemCategory] = useState<FarmerSupportRequest['issueCategory']>('Pest & Disease');
  const [problemDesc, setProblemDesc] = useState('');
  const [reportAppointmentAgreed, setReportAppointmentAgreed] = useState<'agreed' | 'pending'>('pending');
  const [reportDate, setReportDate] = useState('');
  const [reportTime, setReportTime] = useState('10:00 AM');
  const [createdComplaintSuccessId, setCreatedComplaintSuccessId] = useState<string | null>(null);

  const handleReportProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemSubject.trim() || !problemDesc.trim()) return;

    const newComplaintId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const isAgreed = reportAppointmentAgreed === 'agreed' && reportDate;

    const newRequest: FarmerSupportRequest = {
      id: newComplaintId,
      farmerId: activeFarmer.id,
      farmerName: activeFarmer.name,
      phone: activeFarmer.phone,
      village: activeFarmer.village,
      taluka: activeFarmer.taluka,
      district: activeFarmer.district,
      crop: activeFarmer.primaryCrop,
      landAreaAcres: activeFarmer.landAreaAcres,
      subject: problemSubject.trim(),
      issueCategory: problemCategory,
      description: problemDesc.trim(),
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Open',
      priority: 'High',
      appointmentStatus: isAgreed ? 'Visit Scheduled' : 'Appointment Pending',
      appointmentDate: isAgreed ? reportDate : undefined,
      appointmentTime: isAgreed ? reportTime : undefined,
    };

    try {
      const saved = localStorage.getItem('fg_officer_support_requests');
      const list: FarmerSupportRequest[] = saved ? JSON.parse(saved) : [...INITIAL_SUPPORT_REQUESTS];
      localStorage.setItem('fg_officer_support_requests', JSON.stringify([newRequest, ...list]));
      window.dispatchEvent(new Event('fg_support_updated'));
      setCreatedComplaintSuccessId(newComplaintId);
    } catch {}
  };

  const handleResetReportForm = () => {
    setShowReportModal(false);
    setProblemSubject('');
    setProblemDesc('');
    setReportAppointmentAgreed('pending');
    setReportDate('');
    setCreatedComplaintSuccessId(null);
  };

  // Relevant Mandis strictly filtered for active farmer crop
  const relevantMandis = mandis.filter(
    (m) => m.commodity.toLowerCase() === activeFarmer.primaryCrop.toLowerCase()
  );
  const primaryMandi = relevantMandis[0] || null;

  // Cold Storage strictly suitable for active farmer crop
  const relevantStorage = storageFacilities
    .filter((s) => s.suitableCrops.some((c) => c.toLowerCase() === activeFarmer.primaryCrop.toLowerCase()))
    .slice(0, 3);
  const nearestStorage = relevantStorage[0] || null;

  // Calculate live sell-or-store baseline strictly for active farmer crop
  const defaultFuturePrice = primaryMandi ? Math.round(primaryMandi.modalPrice * 1.25) : 0;
  const decisionResult = primaryMandi && nearestStorage ? calculateSellOrStoreDecision({
    commodity: activeFarmer.primaryCrop,
    quantityQuintals: activeFarmer.expectedHarvestQuintals || 180,
    currentMandiPrice: primaryMandi.modalPrice,
    expectedFuturePrice: defaultFuturePrice,
    storageDurationMonths: 3,
    storageCostPerQuintalMonth: nearestStorage.ratePerQuintalMonth,
    transportCostToStoragePerQuintal: 30,
    handlingCostPerQuintal: nearestStorage.handlingCostPerQuintal,
    spoilageLossPercentage: 4,
    opportunityInterestRatePctAnnual: 9.0,
  }) : null;

  // Voice advisories strictly for active farmer crop
  const cropAdvisories = advisories.filter(
    (a) => a.crop.toLowerCase() === activeFarmer.primaryCrop.toLowerCase()
  );
  const latestAdvisory = cropAdvisories.find((a) => a.farmerId === activeFarmer.id) || cropAdvisories[0] || null;


  // Loading skeleton state while authenticated farmer record is queried from Supabase
  if (isLoadingFarmer) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F8E7C9]" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-[#F8E7C9] rounded w-1/3" />
              <div className="h-4 bg-[#F8E7C9] rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#FFFDF7] rounded-xl border border-[#E0C79B]" />
          ))}
        </div>
      </div>
    );
  }

  // Graceful feedback when authenticated farmer record cannot be resolved
  if (farmerProfileError || (!activeFarmer?.name && !isLoadingFarmer)) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-sm text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-[#064E3B]">
          {t('noProfileFound', 'No Registered Farmer Profile Found')}
        </h2>
        <p className="text-sm text-[#064E3B]/80 max-w-md mx-auto">
          {farmerProfileError || 'The authenticated account has no linked registration in the official database.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => refreshFarmerProfile()}
            className="px-4 py-2 bg-[#064E3B] text-[#F8E7C9] rounded-xl font-bold text-xs hover:bg-[#043D2E] transition-colors cursor-pointer"
          >
            {t('retry', 'Retry Loading Profile')}
          </button>
          <Link
            to="/login"
            className="px-4 py-2 bg-[#F8E7C9] text-[#064E3B] rounded-xl font-bold text-xs hover:bg-[#FFFDF7] border border-[#E0C79B] transition-colors"
          >
            {t('backToLogin', 'Back to Login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. FARMER PROFILE BANNER - DYNAMIC SUPABASE DATA */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#064E3B] text-[#F8E7C9] flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              {activeFarmer.name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#064E3B] tracking-tight">
                  {activeFarmer.name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F8E7C9] text-[#064E3B] border border-[#E0C79B]">
                  {activeFarmer.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F8E7C9] text-[#064E3B] border border-[#E0C79B] text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#064E3B]" />
                  {t('verifiedFarmer', 'Verified Farmer')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#064E3B]/80 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#064E3B]/60" />
                  {activeFarmer.village}, {activeFarmer.taluka}, {activeFarmer.district}, {activeFarmer.state}
                </span>
                <span>•</span>
                <span className="font-medium">
                  {t('primaryCrop', 'Primary Crop')}: <strong className="text-[#064E3B]">{activeFarmer.primaryCrop}</strong> ({activeFarmer.landAreaAcres} {t('acres', 'Acres')})
                </span>
                <span>•</span>
                <span className="font-medium">
                  {t('estimatedYield', 'Estimated Yield')}: <strong className="text-[#064E3B]">{activeFarmer.expectedHarvestQuintals} {t('quantityQuintals', 'Quintals')}</strong>
                </span>
                <span>•</span>
                <span className="text-[#064E3B] font-bold bg-[#F8E7C9] border border-[#E0C79B] px-2 py-0.5 rounded">
                  {t('language', 'Language')}: {activeFarmer.preferredLanguage === 'mr' ? 'मराठी' : activeFarmer.preferredLanguage === 'hi' ? 'हिंदी' : activeFarmer.preferredLanguage === 'te' ? 'తెలుగు' : 'English'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
              <span>
                {currentLanguage === 'mr'
                  ? 'समस्या नोंदवा / कृषी अधिकारी भेट'
                  : currentLanguage === 'hi'
                  ? 'समस्या दर्ज करें / अधिकारी दौरा'
                  : 'Report Issue / Officer Visit'}
              </span>
            </button>

            <Link
              to="/farmer/sell-or-store"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-[#F8E7C9] text-xs font-bold hover:bg-[#043D2E] transition-colors shadow-2xs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{t('navSellOrStore', 'Analyze Sell vs Store')}</span>
            </Link>
          </div>

        </div>
      </div>


      {/* 4. TOP METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('currentMandiPrice', 'Current Mandi Price')}
          value={primaryMandi ? `${formatINR(primaryMandi.modalPrice)}/Qtl` : 'Data unavailable'}
          subtitle={primaryMandi ? `${primaryMandi.market} (${primaryMandi.commodity})` : `Data unavailable for this crop`}
          icon={<TrendingUp className="w-4 h-4 text-[#064E3B]" />}
          trend={primaryMandi ? {
            value: primaryMandi.priceTrendPct7d || 4.2,
            label: currentLanguage === 'mr' ? '७-दिवसांचा कल' : currentLanguage === 'hi' ? '7-दिवसीय रुझान' : '7-day trend',
          } : undefined}
        />

        <MetricCard
          title={t('immediateSellValue', 'Immediate Sell Value')}
          value={decisionResult ? formatINR(decisionResult.sellNowNetValue) : 'Data unavailable'}
          subtitle={decisionResult ? `${activeFarmer.expectedHarvestQuintals} Quintals` : `Data unavailable for this crop`}
          icon={<Layers className="w-4 h-4 text-[#064E3B]" />}
        />

        <MetricCard
          title={t('storedNetPotential', '3-Mo Stored Net Potential')}
          value={decisionResult ? formatINR(decisionResult.storeAndSellNetValue) : 'Data unavailable'}
          subtitle={decisionResult ? `Expected at ${formatINR(defaultFuturePrice)}/Qtl` : `Data unavailable for this crop`}
          icon={<Scale className="w-4 h-4 text-[#064E3B]" />}
          highlight={decisionResult?.recommendedAction === 'STORE_AND_WAIT'}
        />

        <MetricCard
          title={t('breakEvenThreshold', 'Break-Even Threshold')}
          value={decisionResult ? `${formatINR(decisionResult.breakEvenFuturePricePerQuintal)}/Qtl` : 'Data unavailable'}
          subtitle={decisionResult ? `+${decisionResult.riskAnalysis.breakEvenMarginPct}% required` : `Data unavailable for this crop`}
          icon={<Warehouse className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* 3. CORE SELL-OR-STORE SUMMARY & ACTIVE ADVISORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sell-or-Store Decision Widget */}
        <div className="lg:col-span-7 bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E0C79B]/50 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#064E3B]" />
                <h2 className="text-base font-bold text-[#064E3B]">
                  {t('navSellOrStore', 'Sell-or-Store Decision Summary')} ({activeFarmer.primaryCrop})
                </h2>
              </div>
              <p className="text-xs text-[#064E3B]/70 mt-0.5">
                {currentLanguage === 'mr'
                  ? `${activeFarmer.primaryCrop} साठी त्वरित विक्री विरुद्ध ३ महिने साठवणूक खर्चाची आर्थिक तुलना.`
                  : currentLanguage === 'hi'
                  ? `${activeFarmer.primaryCrop} के लिए तत्काल बिक्री बनाम 3 माह भंडारण की वित्तीय तुलना।`
                  : `Financial comparison between immediate liquidation and 3-month warehouse preservation for ${activeFarmer.primaryCrop}.`}
              </p>
            </div>
            <Link
              to="/farmer/sell-or-store"
              className="text-xs font-bold text-[#064E3B] hover:underline"
            >
              {t('viewDecisionAnalysis', 'View Decision Analysis →')}
            </Link>
          </div>

          {decisionResult ? (
            <>
              {/* Decision Outcome Strip */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  decisionResult.recommendedAction === 'STORE_AND_WAIT'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={decisionResult.recommendedAction === 'STORE_AND_WAIT' ? 'success' : 'warning'}
                    >
                      {decisionResult.recommendedAction === 'STORE_AND_WAIT' ? t('storeAndWait', 'STORE & SELL LATER') : t('sellNow', 'SELL NOW AT LOCAL MANDI')}
                    </Badge>
                    <span className="text-xs font-bold text-slate-800">
                      {currentLanguage === 'mr' ? 'विश्वसनीयता:' : currentLanguage === 'hi' ? 'विश्वसनीयता:' : 'Confidence:'} {decisionResult.confidenceRating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                    {decisionResult.riskAnalysis.keyAdvice}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] text-[#064E3B]/70 block">{currentLanguage === 'mr' ? 'अंदाजे निव्वळ जास्तीचा फायदा' : currentLanguage === 'hi' ? 'अनुमानित शुद्ध अतिरिक्त लाभ' : 'Est. Net Additional Gain'}</span>
                  <span
                    className={`text-lg font-extrabold ${
                      decisionResult.netAdditionalGainINR >= 0 ? 'text-[#064E3B]' : 'text-rose-600'
                    }`}
                  >
                    {decisionResult.netAdditionalGainINR >= 0 ? '+' : ''}
                    {formatINR(decisionResult.netAdditionalGainINR)}
                  </span>
                </div>
              </div>

              {/* Calculation Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#F8E7C9]/40 rounded-xl border border-[#E0C79B]/60">
                  <span className="text-[#064E3B]/70 block text-[11px] font-semibold">{t('monthlyRent', 'Storage Rent')}</span>
                  <span className="font-bold text-[#064E3B] mt-0.5 block">
                    {formatINR(decisionResult.totalDirectStorageCost)}
                  </span>
                  <span className="text-[10px] text-[#064E3B]/60">₹{nearestStorage?.ratePerQuintalMonth || 85}/Qtl/mo × 3 mo</span>
                </div>

                <div className="p-3 bg-[#F8E7C9]/40 rounded-xl border border-[#E0C79B]/60">
                  <span className="text-[#064E3B]/70 block text-[11px] font-semibold">{t('freightToFacility', 'Freight to Facility')}</span>
                  <span className="font-bold text-[#064E3B] mt-0.5 block">
                    {formatINR(decisionResult.totalTransportCostToStorage)}
                  </span>
                  <span className="text-[10px] text-[#064E3B]/60">₹30/Qtl cartage</span>
                </div>

                <div className="p-3 bg-[#F8E7C9]/40 rounded-xl border border-[#E0C79B]/60">
                  <span className="text-[#064E3B]/70 block text-[11px] font-semibold">{t('handlingFee', 'Handling & Loading')}</span>
                  <span className="font-bold text-[#064E3B] mt-0.5 block">
                    {formatINR(decisionResult.totalHandlingCost)}
                  </span>
                  <span className="text-[10px] text-[#064E3B]/60">₹{nearestStorage?.handlingCostPerQuintal || 30}/Qtl in-out</span>
                </div>

                <div className="p-3 bg-[#F8E7C9]/40 rounded-xl border border-[#E0C79B]/60">
                  <span className="text-[#064E3B]/70 block text-[11px] font-semibold">{currentLanguage === 'mr' ? 'व्याज / वहन खर्च' : currentLanguage === 'hi' ? 'ब्याज / वहन खर्च' : 'Carrying Cost'}</span>
                  <span className="font-bold text-[#064E3B] mt-0.5 block">
                    {formatINR(decisionResult.estimatedFinanceOpportunityCost)}
                  </span>
                  <span className="text-[10px] text-[#064E3B]/60">9% Annual Bank Int.</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 rounded-xl border border-[#E0C79B]/70 bg-[#F8E7C9]/30 text-center space-y-1.5">
              <p className="text-xs font-bold text-[#064E3B]">Data unavailable for this crop</p>
              <p className="text-[11px] text-[#064E3B]/70">
                No active mandi price feeds or accredited cold-storage facilities are currently recorded for {activeFarmer.primaryCrop}.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Latest Voice Advisory Panel */}
        <div className="lg:col-span-5 bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E0C79B]/50 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#064E3B]" />
                <h2 className="text-base font-bold text-[#064E3B]">
                  {currentLanguage === 'mr' ? 'ताज्या व्हॉईस सूचना' : currentLanguage === 'hi' ? 'नवीनतम वॉइस सलाह' : 'Latest Voice Advisory'}
                </h2>
              </div>
              <span className="text-xs text-[#064E3B]/70 font-medium">
                {latestAdvisory ? formatDateTime(latestAdvisory.generatedAt) : 'Recent'}
              </span>
            </div>

            {latestAdvisory ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="success">
                    {latestAdvisory.advisoryType.replace(/_/g, ' ')}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setActiveCallModalAdvisory(latestAdvisory)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#064E3B] hover:underline cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t('simulateCall', 'Simulate Voice Call')}</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-[#064E3B]">
                  {latestAdvisory.headline}
                </h3>

                <p className="text-xs text-[#064E3B] bg-[#F8E7C9]/40 p-3 rounded-xl border border-[#E0C79B]/70 leading-relaxed font-medium">
                  "{currentLanguage === 'mr' ? latestAdvisory.messageMarathi : currentLanguage === 'hi' ? latestAdvisory.messageHindi : latestAdvisory.messageEnglish}"
                </p>

                <AudioPlayerWidget advisory={latestAdvisory} />
              </div>
            ) : (
              <div className="text-xs text-[#064E3B]/70 py-8 text-center bg-[#F8E7C9]/30 rounded-xl border border-[#E0C79B]/70">
                Data unavailable for this crop. No active voice advisories logged for {activeFarmer.primaryCrop}.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E0C79B]/50 flex items-center justify-between">
            <Link
              to="/farmer/advisories"
              className="text-xs font-bold text-[#064E3B] hover:underline"
            >
              {currentLanguage === 'mr' ? `सर्व कॉल इतिहास पहा (${cropAdvisories.length}) →` : currentLanguage === 'hi' ? `संपूर्ण कॉल इतिहास देखें (${cropAdvisories.length}) →` : `View Full Call History (${cropAdvisories.length}) →`}
            </Link>
          </div>
        </div>

      </div>



      {/* Report Agricultural Problem / Officer Visit Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#E0C79B]/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#064E3B]">
                  {currentLanguage === 'mr'
                    ? 'शेतीविषयक समस्या नोंदवा व अधिकारी भेट विनंती'
                    : currentLanguage === 'hi'
                    ? 'कृषि समस्या दर्ज करें एवं अधिकारी दौरा अनुरोध'
                    : 'Report Agricultural Problem & Request Officer Visit'}
                </h3>
                <p className="text-xs text-[#064E3B]/70 mt-0.5">
                  Farmer: <strong className="text-[#064E3B]">{activeFarmer.name}</strong> ({activeFarmer.primaryCrop} • {activeFarmer.village})
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetReportForm}
                className="p-1 rounded-lg text-[#064E3B]/60 hover:text-[#064E3B] hover:bg-[#F8E7C9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdComplaintSuccessId ? (
              <div className="p-4 bg-[#F8E7C9]/60 border border-[#E0C79B] rounded-xl text-xs space-y-3">
                <div className="flex items-center gap-2 text-[#064E3B] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#064E3B]" />
                  <span>Complaint Successfully Raised!</span>
                </div>
                <div className="p-3 bg-[#FFFDF7] rounded-lg border border-[#E0C79B] space-y-1">
                  <div className="font-mono text-xs font-bold text-[#064E3B]">
                    Complaint ID: <span className="text-[#064E3B] underline">{createdComplaintSuccessId}</span>
                  </div>
                  <div className="text-[#064E3B]">
                    <strong>Reported Subject:</strong> {problemSubject}
                  </div>
                  <div className="text-[#064E3B]">
                    <strong>Appointment Status:</strong>{' '}
                    <span className="font-bold text-[#064E3B]">
                      {reportAppointmentAgreed === 'agreed' && reportDate
                        ? `Visit Scheduled: ${reportDate} at ${reportTime}`
                        : 'Appointment Pending'}
                    </span>
                  </div>
                </div>
                <p className="text-[#064E3B]/80 text-[11px] leading-relaxed">
                  Your agricultural problem has been dispatched to the local Agriculture Officer portal under <strong>Farmer Support</strong>. The officer can review symptoms and provide cultivation guidance.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetReportForm}
                    className="px-4 py-2 rounded-xl bg-[#064E3B] text-[#F8E7C9] font-bold text-xs hover:bg-[#043D2E] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportProblem} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Problem Category:
                  </label>
                  <select
                    value={problemCategory}
                    onChange={(e) => setProblemCategory(e.target.value as FarmerSupportRequest['issueCategory'])}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Pest & Disease">Pest & Disease (कीड व रोग)</option>
                    <option value="Nutrient Deficiency">Nutrient Deficiency (पोषण कमतरता)</option>
                    <option value="Irrigation & Weather">Irrigation & Weather (पाणी व हवामान)</option>
                    <option value="Cultivation Practice">Cultivation Practice (लागवड पद्धती)</option>
                    <option value="Market Guidance">Market Guidance (बाजार मार्गदर्शन)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Issue Title / Subject: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yellow leaf curl on tomato or sudden wilting..."
                    value={problemSubject}
                    onChange={(e) => setProblemSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Problem Description & Symptoms: *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe affected acreage, visible symptoms, duration of problem, recent sprays or weather changes..."
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Appointment Preference */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Agriculture Officer Land Visit:
                  </span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="visitAgreement"
                        value="pending"
                        checked={reportAppointmentAgreed === 'pending'}
                        onChange={() => setReportAppointmentAgreed('pending')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Appointment Pending (Officer will schedule visit)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="visitAgreement"
                        value="agreed"
                        checked={reportAppointmentAgreed === 'agreed'}
                        onChange={() => setReportAppointmentAgreed('agreed')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Agree on Preferred Visit Date & Time</span>
                    </label>
                  </div>

                  {reportAppointmentAgreed === 'agreed' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Preferred Date:
                        </label>
                        <input
                          type="date"
                          required
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Preferred Time:
                        </label>
                        <input
                          type="text"
                          value={reportTime}
                          onChange={(e) => setReportTime(e.target.value)}
                          placeholder="e.g. 10:30 AM"
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  )}

                  {reportAppointmentAgreed === 'pending' && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      📌 Notice: Shows <strong>Appointment Pending</strong> in the officer portal. No random date or time is assigned.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleResetReportForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-[#F8E7C9] text-xs font-bold hover:bg-[#043D2E] shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Generate Complaint ID</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Simulated Call Modal */}
      {activeCallModalAdvisory && (
        <SimulatedCallModal
          isOpen={!!activeCallModalAdvisory}
          onClose={() => setActiveCallModalAdvisory(null)}
          advisory={activeCallModalAdvisory}
          farmerPhone={activeFarmer.phone}
        />
      )}

    </div>
  );
};
