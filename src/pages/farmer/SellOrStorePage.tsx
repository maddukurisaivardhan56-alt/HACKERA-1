import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSellOrStoreDecision } from '../../utils/sellOrStoreCalc';
import { SellOrStoreInputs } from '../../types';
import { formatINR } from '../../utils/formatters';
import { DemoTag } from '../../components/common/DemoTag';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { ProfitComparisonChart } from '../../components/charts/ProfitComparisonChart';
import { StorageCostBreakdownChart } from '../../components/charts/StorageCostBreakdownChart';
import {
  RotateCcw,
  Sliders,
} from 'lucide-react';

export const SellOrStorePage: React.FC = () => {
  const { activeFarmer, mandis, storageFacilities, t, currentLanguage } = useApp();

  // Find relevant default price from mandi strictly for active crop
  const matchingMandi = mandis.find(
    (m) => m.commodity.toLowerCase() === activeFarmer.primaryCrop.toLowerCase()
  );

  const matchingStorage = storageFacilities.find((s) =>
    s.suitableCrops.some((c) => c.toLowerCase() === activeFarmer.primaryCrop.toLowerCase())
  );

  // Editable Scenario Inputs State
  const [inputs, setInputs] = useState<SellOrStoreInputs>(() => ({
    commodity: activeFarmer.primaryCrop,
    quantityQuintals: activeFarmer.expectedHarvestQuintals || 180,
    currentMandiPrice: matchingMandi ? matchingMandi.modalPrice : 0,
    expectedFuturePrice: matchingMandi ? Math.round(matchingMandi.modalPrice * 1.25) : 0,
    storageDurationMonths: 3,
    storageCostPerQuintalMonth: matchingStorage ? matchingStorage.ratePerQuintalMonth : 85,
    transportCostToStoragePerQuintal: 30,
    handlingCostPerQuintal: matchingStorage ? matchingStorage.handlingCostPerQuintal : 30,
    spoilageLossPercentage: 4,
    opportunityInterestRatePctAnnual: 9.0,
  }));

  // Re-sync inputs if farmer's crop or harvest yield changes
  React.useEffect(() => {
    if (matchingMandi) {
      setInputs({
        commodity: activeFarmer.primaryCrop,
        quantityQuintals: activeFarmer.expectedHarvestQuintals || 180,
        currentMandiPrice: matchingMandi.modalPrice,
        expectedFuturePrice: Math.round(matchingMandi.modalPrice * 1.25),
        storageDurationMonths: 3,
        storageCostPerQuintalMonth: matchingStorage ? matchingStorage.ratePerQuintalMonth : 85,
        transportCostToStoragePerQuintal: 30,
        handlingCostPerQuintal: matchingStorage ? matchingStorage.handlingCostPerQuintal : 30,
        spoilageLossPercentage: 4,
        opportunityInterestRatePctAnnual: 9.0,
      });
    }
  }, [activeFarmer.primaryCrop, activeFarmer.expectedHarvestQuintals, matchingMandi, matchingStorage]);

  const handleInputChange = (field: keyof SellOrStoreInputs, val: number | string) => {
    setInputs((prev) => ({
      ...prev,
      [field]: typeof val === 'number' ? Math.max(0, val) : val,
    }));
  };

  const handleResetDefaults = () => {
    if (!matchingMandi) return;
    setInputs({
      commodity: activeFarmer.primaryCrop,
      quantityQuintals: activeFarmer.expectedHarvestQuintals || 180,
      currentMandiPrice: matchingMandi.modalPrice,
      expectedFuturePrice: Math.round(matchingMandi.modalPrice * 1.25),
      storageDurationMonths: 3,
      storageCostPerQuintalMonth: matchingStorage ? matchingStorage.ratePerQuintalMonth : 85,
      transportCostToStoragePerQuintal: 30,
      handlingCostPerQuintal: matchingStorage ? matchingStorage.handlingCostPerQuintal : 30,
      spoilageLossPercentage: 4,
      opportunityInterestRatePctAnnual: 9.0,
    });
  };

  // Run live calculation
  const result = useMemo(() => calculateSellOrStoreDecision(inputs), [inputs]);

  // Sensitivity Matrix Calculations
  const sensitivityScenarios = useMemo(() => {
    const percentages = [-15, -10, -5, 0, 5, 10, 15];
    return percentages.map((pct) => {
      const futurePriceScenario = Math.round(inputs.expectedFuturePrice * (1 + pct / 100));
      const scenarioRes = calculateSellOrStoreDecision({
        ...inputs,
        expectedFuturePrice: futurePriceScenario,
      });
      return {
        pctLabel: pct === 0 ? (currentLanguage === 'mr' ? 'अपेक्षित मूळ भाव' : currentLanguage === 'hi' ? 'अपेक्षित मूल भाव' : 'Expected Baseline') : `${pct > 0 ? '+' : ''}${pct}%`,
        futurePrice: futurePriceScenario,
        netGain: scenarioRes.netAdditionalGainINR,
        recommendation: scenarioRes.recommendedAction,
      };
    });
  }, [inputs, currentLanguage]);

  if (!matchingMandi) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t('sellOrStoreTitle', 'Sell-or-Store Financial Decision Analysis')}
              </h1>
              <DemoTag />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentLanguage === 'mr'
                ? 'त्वरित बाजार विक्री विरुद्ध शीतगृह साठवणूक, वजन घट आणि भावी नफ्याचे अचूक आर्थिक विश्लेषण.'
                : currentLanguage === 'hi'
                ? 'तत्काल मंडी बिक्री बनाम शीतगृह भंडारण, वजन घट और भावी लाभ का सटीक वित्तीय विश्लेषण।'
                : 'Compare immediate mandi realization against storage warehouse holding costs, shrinkage, and market upside.'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs shadow-2xs space-y-2">
          <p className="font-semibold text-slate-700 text-sm">
            {currentLanguage === 'mr' ? 'या पिकासाठी माहिती उपलब्ध नाही' : currentLanguage === 'hi' ? 'इस फसल के लिए डेटा उपलब्ध नहीं है' : 'Data unavailable for this crop'}
          </p>
          <p className="text-slate-400">
            {currentLanguage === 'mr'
              ? `${activeFarmer.primaryCrop} पिकासाठी थेट बाजारभाव किंवा साठवणूक माहिती उपलब्ध नाही.`
              : currentLanguage === 'hi'
              ? `${activeFarmer.primaryCrop} फसल के लिए लाइव मंडी भाव या भंडारण जानकारी उपलब्ध नहीं है।`
              : `No live mandi pricing or storage information available for ${activeFarmer.primaryCrop}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t('sellOrStoreTitle', 'Sell-or-Store Financial Decision Analysis')}
            </h1>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentLanguage === 'mr'
              ? 'त्वरित बाजार विक्री विरुद्ध शीतगृह साठवणूक, वजन घट आणि भावी नफ्याचे अचूक आर्थिक विश्लेषण.'
              : currentLanguage === 'hi'
              ? 'तत्काल मंडी बिक्री बनाम शीतगृह भंडारण, वजन घट और भावी लाभ का सटीक वित्तीय विश्लेषण।'
              : 'Compare immediate mandi realization against storage warehouse holding costs, shrinkage, and market upside.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('navResetSeed', 'Reset Parameters')}</span>
        </button>
      </div>

      {/* Uncertainty Disclaimer Banner */}
      <AlertBanner
        type="warning"
        title={currentLanguage === 'mr' ? 'आर्थिक मॉडेल सूचना' : currentLanguage === 'hi' ? 'वित्तीय मॉडल सूचना' : 'Scenario Comparison Model Notice'}
        message={
          currentLanguage === 'mr'
            ? 'भावी बाजारभाव अनिश्चित असतात. हे टूल आपल्या अपेक्षेनुसार आणि साठवणूक खर्चानुसार तुलनात्मक विश्लेषण करते, हा हमी नफा नाही.'
            : currentLanguage === 'hi'
            ? 'भावी मंडी भाव अनिश्चित होते हैं। यह टूल आपकी अपेक्षाओं और भंडारण लागत के आधार पर तुलनात्मक विश्लेषण प्रस्तुत करता है, यह कोई गारंटीकृत लाभ नहीं है।'
            : 'Future market prices are uncertain. This decision support tool provides financial scenario modelling based on your chosen price expectations and holding costs, not a guaranteed profit promise.'
        }
      />

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE INPUTS (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E0C79B]/50 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#064E3B]" />
              <h2 className="text-base font-bold text-[#064E3B]">
                {t('decisionVariables', 'Decision Variables')}
              </h2>
            </div>
            <span className="text-[11px] text-[#064E3B]/60 font-semibold">{currentLanguage === 'mr' ? 'थेट अपडेट' : currentLanguage === 'hi' ? 'लाइव अपडेट' : 'Live Updating'}</span>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Commodity & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('commodity', 'Commodity')}
                </label>
                <input
                  type="text"
                  value={inputs.commodity}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('quantityQuintals', 'Quantity (Quintals)')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={inputs.quantityQuintals}
                  onChange={(e) => handleInputChange('quantityQuintals', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-1 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ≈ {Math.round(inputs.quantityQuintals * 100).toLocaleString()} Kg
                </span>
              </div>
            </div>

            {/* Current Price vs Future Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('currentPricePerQtl', 'Current Mandi Price (₹/Qtl)')}
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={inputs.currentMandiPrice}
                  onChange={(e) => handleInputChange('currentMandiPrice', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-1 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {currentLanguage === 'mr' ? 'आजचा मूळ भाव' : currentLanguage === 'hi' ? 'आज का मूल भाव' : "Today's base price"}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#064E3B] mb-1">
                  {t('expectedFuturePrice', 'Expected Future Price (₹/Qtl)')}
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={inputs.expectedFuturePrice}
                  onChange={(e) => handleInputChange('expectedFuturePrice', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E0C79B] bg-[#F8E7C9]/40 font-bold text-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                />
                <span className="text-[10px] text-[#064E3B] mt-0.5 block font-bold">
                  {inputs.expectedFuturePrice >= inputs.currentMandiPrice
                    ? `+${(((inputs.expectedFuturePrice - inputs.currentMandiPrice) / inputs.currentMandiPrice) * 100).toFixed(1)}% expectation`
                    : 'Lower than current'}
                </span>
              </div>
            </div>

            {/* Storage Duration Slider */}
            <div className="p-3 bg-[#F8E7C9]/40 rounded-xl border border-[#E0C79B]/60 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[#064E3B]">
                  {t('storageDuration', 'Storage Holding Duration')}:
                </label>
                <span className="font-bold text-[#064E3B] text-sm">
                  {inputs.storageDurationMonths} {t('months', 'Months')}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={inputs.storageDurationMonths}
                onChange={(e) => handleInputChange('storageDurationMonths', Number(e.target.value))}
                className="w-full accent-[#064E3B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 {t('months', 'Mo')}</span>
                <span>3 {t('months', 'Mo')}</span>
                <span>6 {t('months', 'Mo')}</span>
              </div>
            </div>

            {/* Detailed Storage Costs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('monthlyRent', 'Monthly Rent (₹/Qtl/Mo)')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={inputs.storageCostPerQuintalMonth}
                  onChange={(e) => handleInputChange('storageCostPerQuintalMonth', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('freightToFacility', 'Freight to Facility (₹/Qtl)')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={inputs.transportCostToStoragePerQuintal}
                  onChange={(e) => handleInputChange('transportCostToStoragePerQuintal', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('handlingFee', 'Handling & Loading (₹/Qtl)')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={inputs.handlingCostPerQuintal}
                  onChange={(e) => handleInputChange('handlingCostPerQuintal', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('shrinkageLoss', 'Moisture/Shrinkage Loss (%)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={inputs.spoilageLossPercentage}
                  onChange={(e) => handleInputChange('spoilageLossPercentage', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: DECISION REALIZATION & VISUAL CHARTS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Decision Banner Card */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 shadow-xs ${
              result.recommendedAction === 'STORE_AND_WAIT'
                ? 'bg-[#F8E7C9]/40 border-[#064E3B]'
                : 'bg-amber-50/50 border-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0C79B]/50 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#064E3B]/70">
                  {t('recommendedStrategy', 'Recommended Strategy')}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-xl font-extrabold text-[#064E3B]">
                    {result.recommendedAction === 'STORE_AND_WAIT'
                      ? t('storeAndWait', 'STORE & SELL LATER')
                      : t('sellNow', 'SELL NOW AT LOCAL MANDI')}
                  </h3>
                  <Badge variant={result.recommendedAction === 'STORE_AND_WAIT' ? 'success' : 'warning'}>
                    {result.confidenceRating}
                  </Badge>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-[#064E3B]/70 block">{currentLanguage === 'mr' ? 'निव्वळ अतिरिक्त फायदा' : currentLanguage === 'hi' ? 'शुद्ध अतिरिक्त लाभ' : 'Scenario Net Surplus'}</span>
                <span
                  className={`text-2xl font-black ${
                    result.netAdditionalGainINR >= 0 ? 'text-[#064E3B]' : 'text-rose-600'
                  }`}
                >
                  {result.netAdditionalGainINR >= 0 ? '+' : ''}
                  {formatINR(result.netAdditionalGainINR)}
                </span>
                <span className="text-[11px] font-bold text-[#064E3B]/80 block">
                  ({result.netGainPercentage > 0 ? '+' : ''}{result.netGainPercentage}% gain over sell-now)
                </span>
              </div>
            </div>

            <p className="text-xs text-[#064E3B] leading-relaxed mt-3 font-medium">
              {result.riskAnalysis.keyAdvice}
            </p>
          </div>

          {/* Side-by-Side Comparison Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Scenario A Card */}
            <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#064E3B]/70 uppercase tracking-wider">
                  {t('scenarioASellNow', 'Scenario A: Sell Today')}
                </span>
                <Badge variant="neutral">{currentLanguage === 'mr' ? 'त्वरित रोख' : currentLanguage === 'hi' ? 'तत्काल नकद' : 'Immediate Cash'}</Badge>
              </div>

              <div>
                <div className="text-2xl font-bold text-[#064E3B]">
                  {formatINR(result.sellNowNetValue)}
                </div>
                <span className="text-[11px] text-[#064E3B]/70">{t('netCashInHand', 'Net in-hand cash')}</span>
              </div>

              <div className="pt-2 border-t border-[#E0C79B]/40 text-xs space-y-1 text-[#064E3B]/80">
                <div className="flex justify-between">
                  <span>{currentLanguage === 'mr' ? 'एकूण उत्पन्न:' : currentLanguage === 'hi' ? 'सकल प्राप्ति:' : 'Gross Realization:'}</span>
                  <span className="font-semibold text-[#064E3B]">{formatINR(result.sellNowGrossValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{currentLanguage === 'mr' ? 'स्थानिक वाहतूक खर्च:' : currentLanguage === 'hi' ? 'स्थानीय परिवहन खर्च:' : 'Local Mandi Cartage:'}</span>
                  <span className="text-rose-600">-{formatINR(result.sellNowTransportCost)}</span>
                </div>
              </div>
            </div>

            {/* Scenario B Card */}
            <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                  {t('scenarioBStore', 'Scenario B: Store Later')}
                </span>
                <Badge variant="success">{currentLanguage === 'mr' ? 'भावी नफा' : currentLanguage === 'hi' ? 'भावी लाभ' : 'Deferred Upside'}</Badge>
              </div>

              <div>
                <div className="text-2xl font-bold text-[#064E3B]">
                  {formatINR(result.storeAndSellNetValue)}
                </div>
                <span className="text-[11px] text-[#064E3B]/70">{t('netCashInHand', 'Projected net realization')}</span>
              </div>

              <div className="pt-2 border-t border-[#E0C79B]/40 text-xs space-y-1 text-[#064E3B]/80">
                <div className="flex justify-between">
                  <span>{currentLanguage === 'mr' ? `भावी विक्री (${result.effectiveQuantityAfterSpoilage} क्विंटल):` : currentLanguage === 'hi' ? `भावी बिक्री (${result.effectiveQuantityAfterSpoilage} क्विंटल):` : `Gross Sale (${result.effectiveQuantityAfterSpoilage} Qtl):`}</span>
                  <span className="font-semibold text-[#064E3B]">{formatINR(result.futureGrossSellingValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('carryingCosts', 'Total Storage & Carrying:')}</span>
                  <span className="text-rose-600">-{formatINR(result.totalStorageRelatedCosts)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Visual Comparison Charts */}
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#064E3B]">
              {currentLanguage === 'mr' ? 'निव्वळ उत्पन्न व खर्च विभाजन आलेख' : currentLanguage === 'hi' ? 'शुद्ध प्राप्ति एवं लागत विभाजन आलेख' : 'Net Realization & Cost Breakdown Visualization'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-xs font-bold text-[#064E3B] block mb-2 text-center">
                  {currentLanguage === 'mr' ? 'निव्वळ नफा तुलना' : currentLanguage === 'hi' ? 'शुद्ध लाभ तुलना' : 'Net Cash Comparison'}
                </span>
                <ProfitComparisonChart result={result} />
              </div>

              <div>
                <span className="text-xs font-bold text-[#064E3B] block mb-2 text-center">
                  {currentLanguage === 'mr' ? 'साठवणूक खर्च घटक' : currentLanguage === 'hi' ? 'भंडारण लागत घटक' : 'Storage Cost Elements'}
                </span>
                <StorageCostBreakdownChart result={result} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SENSITIVITY STRESS TEST TABLE */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#064E3B]">
            {currentLanguage === 'mr' ? 'भाव बदल संवेदनशीलता विश्लेषण' : currentLanguage === 'hi' ? 'भाव परिवर्तन संवेदनशीलता विश्लेषण' : 'Scenario Sensitivity & Price Volatility Matrix'}
          </h3>
          <p className="text-xs text-[#064E3B]/70 mt-0.5">
            {currentLanguage === 'mr'
              ? 'जर भावी बाजारभावात बदल झाला तर आपल्या नफ्यावर काय परिणाम होईल याचे मूल्यांकन.'
              : currentLanguage === 'hi'
              ? 'यदि भविष्य के मंडी भाव में उतार-चढ़ाव आता है तो आपके लाभ पर पड़ने वाले प्रभाव का मूल्यांकन।'
              : 'Evaluates your profit outcome if the future market price varies from your current expectation.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E0C79B] bg-[#F8E7C9]/60 text-[#064E3B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">{currentLanguage === 'mr' ? 'भाव तफावत' : currentLanguage === 'hi' ? 'भाव अंतर' : 'Price Deviation'}</th>
                <th className="py-2.5 px-3">{t('expectedFuturePrice', 'Future Selling Price')}</th>
                <th className="py-2.5 px-3">{currentLanguage === 'mr' ? 'निव्वळ फायदा / तोटा' : currentLanguage === 'hi' ? 'शुद्ध लाभ / हानि' : 'Net Gain / Loss vs Sell-Now'}</th>
                <th className="py-2.5 px-3">{t('recommendedStrategy', 'Optimal Strategy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0C79B]/40">
              {sensitivityScenarios.map((sc, i) => (
                <tr key={i} className={`table-row-hover ${sc.pctLabel.includes('Baseline') || sc.pctLabel.includes('मूळ') || sc.pctLabel.includes('मूल') ? 'bg-[#F8E7C9]/40 font-bold' : ''}`}>
                  <td className="py-2.5 px-3 font-semibold text-[#064E3B]">
                    {sc.pctLabel}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#064E3B]">
                    {formatINR(sc.futurePrice)}/Qtl
                  </td>
                  <td className="py-2.5 px-3 font-bold">
                    <span className={sc.netGain >= 0 ? 'text-[#064E3B]' : 'text-rose-600'}>
                      {sc.netGain >= 0 ? '+' : ''}{formatINR(sc.netGain)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={sc.recommendation === 'STORE_AND_WAIT' ? 'success' : 'warning'}>
                      {sc.recommendation.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
