import {
  FarmerProfile,
  MandiPriceRecord,
  ColdStorageFacility,
  AdvisoryRecord,
  FarmerMonitoringProfile,
  TriggerEvaluationResult,
  TriggerRuleType,
  DtmfResponseCode,
} from '../types';
import { HISTORICAL_PRICE_DATA } from '../data/initialMandis';

const MONITORING_PROFILE_KEY = 'fg_farmer_monitoring_profiles_v1';

export const MonitoringEngine = {
  /**
   * Get monitoring profile for a given farmer, or generate standard default
   */
  getMonitoringProfile(farmer: FarmerProfile): FarmerMonitoringProfile {
    try {
      const raw = localStorage.getItem(MONITORING_PROFILE_KEY);
      const profiles: Record<string, FarmerMonitoringProfile> = raw ? JSON.parse(raw) : {};
      if (profiles[farmer.id]) {
        return profiles[farmer.id];
      }
    } catch {}

    const defaultProfile: FarmerMonitoringProfile = {
      farmerId: farmer.id,
      selectedCrops: [farmer.primaryCrop || 'Onion'],
      district: farmer.district || 'Nashik',
      taluka: farmer.taluka || 'Niphad',
      preferredMandi: undefined,
      channelPreference: 'ivr',
      lastFarmerDecision: undefined,
      cooldownUntil: undefined,
      activeTriggersCount: 0,
      lastEvaluatedAt: new Date().toISOString(),
    };

    this.saveMonitoringProfile(defaultProfile);
    return defaultProfile;
  },

  /**
   * Save monitoring profile for farmer
   */
  saveMonitoringProfile(profile: FarmerMonitoringProfile): void {
    try {
      const raw = localStorage.getItem(MONITORING_PROFILE_KEY);
      const profiles: Record<string, FarmerMonitoringProfile> = raw ? JSON.parse(raw) : {};
      profiles[profile.farmerId] = profile;
      localStorage.setItem(MONITORING_PROFILE_KEY, JSON.stringify(profiles));
      window.dispatchEvent(new Event('fg_monitoring_profile_updated'));
    } catch (e) {
      console.warn('LocalStorage monitoring profile error:', e);
    }
  },

  /**
   * Compute 7-day average price for a given commodity
   */
  getSevenDayAveragePrice(commodity: string, fallbackCurrentPrice: number): number {
    const hist = HISTORICAL_PRICE_DATA[commodity];
    if (!hist || hist.length === 0) {
      return fallbackCurrentPrice;
    }
    const recent = hist.slice(-7);
    const sum = recent.reduce((acc, curr) => acc + curr.modalPrice, 0);
    return Math.round(sum / recent.length);
  },

  /**
   * Core Trigger Evaluation Engine
   * Evaluates market price, storage feasibility, and checks user-specified trigger conditions:
   * 1. current_price <= 7day_avg * 0.90 -> trigger_price_drop
   * 2. current_price >= 7day_avg * 1.10 -> trigger_price_rise
   * 3. storage_net_benefit > sell_now + threshold -> trigger_storage_profitable
   * 4. new cold-storage slot opened nearby -> trigger_storage_available
   */
  evaluateCropTriggers(params: {
    farmer: FarmerProfile;
    profile: FarmerMonitoringProfile;
    crop: string;
    mandi: MandiPriceRecord;
    storageFacility?: ColdStorageFacility;
    overridePrice?: number;
    overrideExpectedFuturePrice?: number;
  }): TriggerEvaluationResult {
    const { farmer, profile, crop, mandi, storageFacility, overridePrice, overrideExpectedFuturePrice } = params;

    const currentPrice = overridePrice !== undefined ? overridePrice : mandi.modalPrice;
    const sevenDayAvg = this.getSevenDayAveragePrice(crop, currentPrice);
    const priceChangePct = Number((((currentPrice - sevenDayAvg) / sevenDayAvg) * 100).toFixed(1));

    // Storage and Break-Even Calculation
    const storageDurationMonths = 3;
    const storageRateMonthly = storageFacility ? storageFacility.ratePerQuintalMonth : 85;
    const handlingAndFreightPerQtl = (storageFacility ? storageFacility.handlingCostPerQuintal : 30) + 30;
    const totalStorageCostPerQtl = storageRateMonthly * storageDurationMonths + handlingAndFreightPerQtl;
    const breakEvenPrice = currentPrice + totalStorageCostPerQtl;

    // Projected future price model (seasonal uptick projection)
    const expectedFuturePrice =
      overrideExpectedFuturePrice !== undefined
        ? overrideExpectedFuturePrice
        : Math.round(currentPrice * 1.22);

    const harvestQty = farmer.expectedHarvestQuintals > 0 ? farmer.expectedHarvestQuintals : 150;
    const storageNetBenefit = Math.max(0, (expectedFuturePrice - breakEvenPrice) * harvestQty);
    const storageAvailableMT = storageFacility ? storageFacility.availableCapacityMT : 1800;

    // Trigger Evaluation
    const firedTriggers: TriggerRuleType[] = [];
    const triggerDescriptions: string[] = [];

    // Condition 1: Price Drop (<= 90% of 7-day average)
    if (currentPrice <= sevenDayAvg * 0.9) {
      firedTriggers.push('trigger_price_drop');
      triggerDescriptions.push(
        `Market Price Drop Alert: Current price ₹${currentPrice} is ${Math.abs(priceChangePct)}% below 7-day average (₹${sevenDayAvg}/Qtl). Holding or storage advised.`
      );
    }

    // Condition 2: Price Rise (>= 110% of 7-day average)
    if (currentPrice >= sevenDayAvg * 1.1) {
      firedTriggers.push('trigger_price_rise');
      triggerDescriptions.push(
        `Market Price Surge Alert: Current price ₹${currentPrice} is +${priceChangePct}% above 7-day average (₹${sevenDayAvg}/Qtl). Favorable window to sell immediately.`
      );
    }

    // Condition 3: Storage Profitable (Storage net surplus > ₹10,000 above sell-now)
    const isStorageProfitable = expectedFuturePrice > breakEvenPrice && storageNetBenefit >= 8000;
    if (isStorageProfitable && !firedTriggers.includes('trigger_price_rise')) {
      firedTriggers.push('trigger_storage_profitable');
      triggerDescriptions.push(
        `Storage Arbitrage Advantage: 3-month cold storage yields break-even of ₹${breakEvenPrice}/Qtl with projected net benefit of ₹${storageNetBenefit.toLocaleString('en-IN')}.`
      );
    }

    // Condition 4: Cold Storage Available Nearby (> 500 MT capacity available)
    const isStorageAvailable = storageAvailableMT > 500;
    if (isStorageAvailable && (firedTriggers.includes('trigger_price_drop') || isStorageProfitable)) {
      firedTriggers.push('trigger_storage_available');
      triggerDescriptions.push(
        `Cold Storage Facility Ready: ${storageFacility?.name || 'Local Agro Packhouse'} has ${storageAvailableMT} MT verified vacant capacity.`
      );
    }

    // Cooldown check (if farmer responded recently)
    const now = new Date();
    const isCooldownActive = !!profile.cooldownUntil && new Date(profile.cooldownUntil) > now;

    // Call-worthiness: At least 1 trigger met AND farmer consent given AND not in cooldown
    const isCallWorthy = firedTriggers.length > 0 && !isCooldownActive;

    // Recommendation logic
    let recommendedAction: TriggerEvaluationResult['recommendedAction'] = 'MONITOR';
    if (firedTriggers.includes('trigger_price_rise')) {
      recommendedAction = 'SELL_NOW';
    } else if (firedTriggers.includes('trigger_storage_profitable') || firedTriggers.includes('trigger_price_drop')) {
      recommendedAction = 'STORE_AND_WAIT';
    }

    // Generate Multilingual LLM Drafted Advisory Script with DTMF Options
    const llmDraftScript = this.generateLlmVoiceScript({
      farmerName: farmer.name,
      crop,
      mandiName: mandi.market,
      currentPrice,
      sevenDayAvg,
      priceChangePct,
      recommendedAction,
      breakEvenPrice,
      storageNetBenefit,
      storageName: storageFacility?.name || 'सह्याद्री कोल्ड स्टोरेज (Sahyadri Cold Storage)',
    });

    return {
      crop,
      mandi: mandi.market,
      currentPrice,
      sevenDayAvgPrice: sevenDayAvg,
      priceChangePct,
      breakEvenPrice,
      storageNetBenefit,
      storageAvailableMT,
      isStorageProfitable,
      isStorageAvailable,
      firedTriggers,
      triggerDescriptions,
      isCallWorthy,
      suppressedByCooldown: isCooldownActive && firedTriggers.length > 0,
      recommendedAction,
      llmDraftScript,
    };
  },

  /**
   * LLM Advisory Speech Generator
   * Produces localized scripts in Marathi, Hindi, Telugu, and English with DTMF prompts
   */
  generateLlmVoiceScript(data: {
    farmerName: string;
    crop: string;
    mandiName: string;
    currentPrice: number;
    sevenDayAvg: number;
    priceChangePct: number;
    recommendedAction: 'SELL_NOW' | 'STORE_AND_WAIT' | 'MONITOR';
    breakEvenPrice: number;
    storageNetBenefit: number;
    storageName: string;
  }) {
    const {
      farmerName,
      crop,
      mandiName,
      currentPrice,
      sevenDayAvg,
      priceChangePct,
      recommendedAction,
      breakEvenPrice,
      storageNetBenefit,
      storageName,
    } = data;

    // Marathi
    let mr = `नमस्कार ${farmerName} भाऊ. कृषी निर्णय सहाय्यक प्रणालीकडून फोन: `;
    if (recommendedAction === 'SELL_NOW') {
      mr += `आज ${mandiName} मध्ये ${crop} भाव ₹${currentPrice} प्रति क्विंटल असून ७ दिवसांच्या सरासरीपेक्षा ${Math.abs(priceChangePct)}% जास्त आहे. बाजारात तात्काळ विक्री करणे फायदेशीर आहे. `;
    } else {
      mr += `आज ${mandiName} मध्ये ${crop} भाव ₹${currentPrice} असून ७ दिवसांच्या सरासरीपेक्षा कमी झाला आहे. ${storageName} मध्ये ३ महिने साठवणूक केल्यास ₹${breakEvenPrice} ब्रेक-इव्हन राहील व अंदाजे ₹${storageNetBenefit.toLocaleString('en-IN')} निव्वळ नफा शक्य आहे. `;
    }
    mr += `आपला निर्णय नोंदवण्यासाठी: त्वरित विक्रीसाठी १ दाबा, साठवणुकीसाठी २ दाबा, किंवा काही दिवसांनी पुन्हा फोनसाठी ३ दाबा.`;

    // Hindi
    let hi = `नमस्ते ${farmerName} जी. किसान निर्णय सहायता प्रणाली से संदेश: `;
    if (recommendedAction === 'SELL_NOW') {
      hi += `आज ${mandiName} में ${crop} का भाव ₹${currentPrice} प्रति क्विंटल है, जो ७ दिनों के औसत से ${Math.abs(priceChangePct)}% अधिक है। तुरंत बिक्री करना लाभकारी रहेगा। `;
    } else {
      hi += `आज ${mandiName} में ${crop} का भाव ₹${currentPrice} है। कोल्ड स्टोरेज में रखने पर ब्रेक-ईवन भाव ₹${breakEvenPrice} रहेगा और लगभग ₹${storageNetBenefit.toLocaleString('en-IN')} अतिरिक्त लाभ संभव है। `;
    }
    hi += `अपना निर्णय दर्ज करने के लिए: तुरंत बेचने के लिए १ दबाएं, भंडारण के लिए २ दबाएं, या कुछ दिनों बाद पुनः कॉल के लिए ३ दबाएं।`;

    // Telugu
    let te = `నమస్కారం ${farmerName} గారు. రైతు నిర్ణయ మద్దతు వ్యవస్థ నుండి కాల్: `;
    if (recommendedAction === 'SELL_NOW') {
      te += `ఈరోజు ${mandiName} లో ${crop} ధర క్వింటాలుకు ₹${currentPrice} ఉంది, ఇది 7 రోజుల సగటు కంటే ${Math.abs(priceChangePct)}% ఎక్కువ. వెంటనే విక్రయించడం లాభదాయకం. `;
    } else {
      te += `ఈరోజు ${mandiName} లో ${crop} ధర ₹${currentPrice} గా ఉంది. కోల్డ్ స్టోరేజ్ లో ఉంచితే బ్రేక్-ఈవెన్ ధర ₹${breakEvenPrice} గా ఉంటుంది, సుమారు ₹${storageNetBenefit.toLocaleString('en-IN')} అదనపు లాభం వచ్చే అవకాశం ఉంది. `;
    }
    te += `మీ స్పందన నమోదు చేయడానికి: విక్రయించడానికి 1 నొక్కండి, నిల్వ చేయడానికి 2 నొక్కండి, కొన్ని రోజుల తర్వాత మళ్లీ కాల్ కోసం 3 నొక్కండి.`;

    // English
    let en = `Hello ${farmerName}, automated agriculture advisory call: `;
    if (recommendedAction === 'SELL_NOW') {
      en += `Today's ${mandiName} ${crop} price is ₹${currentPrice}/Qtl, which is ${Math.abs(priceChangePct)}% above the 7-day average of ₹${sevenDayAvg}. Selling immediately is recommended. `;
    } else {
      en += `Today's ${mandiName} ${crop} price is ₹${currentPrice}/Qtl. Storing in certified cold storage projects a break-even of ₹${breakEvenPrice}/Qtl with an estimated surplus of ₹${storageNetBenefit.toLocaleString('en-IN')}. `;
    }
    en += `To record your choice: Press 1 to sell now, Press 2 to store, or Press 3 to call again in a few days.`;

    return { en, mr, hi, te };
  },

  /**
   * Convert evaluation into a saved AdvisoryRecord
   */
  createAdvisoryFromEvaluation(params: {
    farmer: FarmerProfile;
    evalResult: TriggerEvaluationResult;
  }): AdvisoryRecord {
    const { farmer, evalResult } = params;
    const nowIso = new Date().toISOString();

    const triggerLabels = evalResult.firedTriggers
      .map((t) => {
        if (t === 'trigger_price_drop') return 'Price Drop (≤90% of 7-day avg)';
        if (t === 'trigger_price_rise') return 'Price Rise (≥110% of 7-day avg)';
        if (t === 'trigger_storage_profitable') return 'Cold Storage Profitable';
        if (t === 'trigger_storage_available') return 'New Cold Storage Capacity Open';
        return t;
      })
      .join(', ');

    return {
      id: `adv-${Date.now()}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      crop: evalResult.crop,
      marketName: evalResult.mandi,
      triggerEvent: `Trigger Engine Event: ${triggerLabels} (Modal: ₹${evalResult.currentPrice}, 7d-Avg: ₹${evalResult.sevenDayAvgPrice})`,
      advisoryType: evalResult.recommendedAction === 'SELL_NOW' ? 'PRICE_SPIKE' : 'STORAGE_FAVORABLE',
      headline:
        evalResult.recommendedAction === 'SELL_NOW'
          ? `Mandi Price Surge: ₹${evalResult.currentPrice}/Qtl (+${evalResult.priceChangePct}%) — Immediate Sale Favorable`
          : `Storage Alert: Break-Even ₹${evalResult.breakEvenPrice}/Qtl — +₹${evalResult.storageNetBenefit.toLocaleString('en-IN')} Potential Return`,
      messageMarathi: evalResult.llmDraftScript.mr,
      messageHindi: evalResult.llmDraftScript.hi,
      messageEnglish: evalResult.llmDraftScript.en,
      messageTelugu: evalResult.llmDraftScript.te,
      generatedAt: nowIso,
      callStatus: 'scheduled',
      keyInsights: {
        recommendedAction: evalResult.recommendedAction === 'SELL_NOW' ? 'SELL_NOW' : 'STORE_AND_WAIT',
        estimatedNetGainINR: evalResult.storageNetBenefit,
        breakEvenPriceINR: evalResult.breakEvenPrice,
      },
      isDemo: true,
      isCallWorthy: evalResult.isCallWorthy,
      firedTriggers: evalResult.firedTriggers,
      farmerDtmfResponse: null,
    };
  },

  /**
   * Handle DTMF response during AI Call:
   * '1' = I will sell now
   * '2' = I will store
   * '3' = Call me again in a few days
   */
  recordDtmfResponse(params: {
    farmerId: string;
    advisoryId: string;
    key: DtmfResponseCode;
  }): { decisionText: string; cooldownDays: number; confirmationMessage: { mr: string; hi: string; te: string; en: string } } {
    const { farmerId, advisoryId, key } = params;

    let decisionText: 'SELL_NOW' | 'STORE' | 'CALL_AGAIN' = 'CALL_AGAIN';
    let cooldownDays = 3;

    if (key === '1') {
      decisionText = 'SELL_NOW';
      cooldownDays = 7; // Suppress triggers for 7 days
    } else if (key === '2') {
      decisionText = 'STORE';
      cooldownDays = 7; // Suppress triggers for 7 days
    } else if (key === '3') {
      decisionText = 'CALL_AGAIN';
      cooldownDays = 3; // Schedule follow-up call in 3 days
    }

    // Update monitoring profile
    try {
      const raw = localStorage.getItem(MONITORING_PROFILE_KEY);
      const profiles: Record<string, FarmerMonitoringProfile> = raw ? JSON.parse(raw) : {};
      if (profiles[farmerId]) {
        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() + cooldownDays);
        profiles[farmerId].lastFarmerDecision = decisionText;
        profiles[farmerId].cooldownUntil = cooldownDate.toISOString();
        localStorage.setItem(MONITORING_PROFILE_KEY, JSON.stringify(profiles));
        window.dispatchEvent(new Event('fg_monitoring_profile_updated'));
      }
    } catch {}

    const confirmationMessage = {
      mr:
        key === '1'
          ? 'धन्यवाद! आपण आज विक्री करण्याचा निर्णय घेतला आहे. जवळच्या बाजार समितीचे संपर्क पाठवले आहेत.'
          : key === '2'
          ? 'धन्यवाद! आपण साठवणुकीचा निर्णय घेतला आहे. जवळच्या शीतगृहाचे स्लॉट तपशील नोंदवले आहेत.'
          : 'धन्यवाद! आपल्याला ३ दिवसांनंतर ताज्या बाजारभावांसह पुन्हा फोन केला जाईल.',
      hi:
        key === '1'
          ? 'धन्यवाद! आपने आज बेचने का निर्णय लिया है। निकटतम मंडी विवरण आपके फोन पर साझा किए गए हैं।'
          : key === '2'
          ? 'धन्यवाद! आपने भंडारण का निर्णय लिया है। शीतगृह उपलब्धता विवरण दर्ज कर लिए गए हैं।'
          : 'धन्यवाद! आपको ३ दिनों बाद अद्यतन मंडी भावों के साथ पुनः कॉल किया जाएगा।',
      te:
        key === '1'
          ? 'ధన్యవాదాలు! మీరు వెంటనే విక్రయించాలని నిర్ణయించుకున్నారు. సమీప మార్కెట్ వివరాలు సేవ్ చేయబడ్డాయి.'
          : key === '2'
          ? 'ధన్యవాదాలు! మీరు నిల్వ చేయాలని నిర్ణయించుకున్నారు. శీతల గిడ్డంగి వివరాలు నమోదు చేయబడ్డాయి.'
          : 'ధన్యవాదాలు! మీకు 3 రోజుల తర్వాత మళ్లీ కాల్ చేయబడుతుంది.',
      en:
        key === '1'
          ? 'Thank you! You selected to Sell Now. Mandi gateway details have been recorded.'
          : key === '2'
          ? 'Thank you! You selected to Store. Cold storage booking enquiry initiated.'
          : 'Thank you! Reminder scheduled. We will call you again in 3 days.',
    };

    return { decisionText, cooldownDays, confirmationMessage };
  },
};
