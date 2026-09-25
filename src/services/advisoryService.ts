import { AdvisoryRecord, FarmerProfile, MandiPriceRecord, ColdStorageFacility } from '../types';

export interface GenerateAdvisoryParams {
  farmer: FarmerProfile;
  commodity: string;
  mandi: MandiPriceRecord;
  alternativeMandi?: MandiPriceRecord;
  storageFacility?: ColdStorageFacility;
  expectedFuturePrice: number;
  storageDurationMonths: number;
}

export const AdvisoryService = {
  /**
   * Synthesize tailored multilingual advisory messages based on mathematical models
   */
  generateAdvisory(params: GenerateAdvisoryParams): AdvisoryRecord {
    const {
      farmer,
      commodity,
      mandi,
      alternativeMandi,
      storageFacility,
      expectedFuturePrice,
      storageDurationMonths,
    } = params;

    const currentPrice = mandi.modalPrice;
    const monthlyRate = storageFacility ? storageFacility.ratePerQuintalMonth : 85;
    const handling = storageFacility ? storageFacility.handlingCostPerQuintal : 30;
    const qty = farmer.expectedHarvestQuintals || 150;

    // Break-even calculation
    const totalCostPerQtl = monthlyRate * storageDurationMonths + handling + 30; // 30 is freight
    const breakEven = currentPrice + totalCostPerQtl;
    const estimatedNetGain = Math.max(0, (expectedFuturePrice - breakEven) * qty);

    const isStorageFavorable = expectedFuturePrice > breakEven && estimatedNetGain > 5000;
    const hasMandiArbitrage =
      alternativeMandi && alternativeMandi.modalPrice > currentPrice + 60;

    let headline = '';
    let advisoryType: AdvisoryRecord['advisoryType'] = 'STORAGE_FAVORABLE';
    let recommendedAction: AdvisoryRecord['keyInsights']['recommendedAction'] = 'STORE_AND_WAIT';

    if (isStorageFavorable) {
      headline = `साठवणूक सल्ला: ${storageDurationMonths} महिने साठवणुकीतून ₹${Math.round(
        estimatedNetGain
      ).toLocaleString('en-IN')} नफ्याची शक्यता`;
      advisoryType = 'STORAGE_FAVORABLE';
      recommendedAction = 'STORE_AND_WAIT';
    } else if (hasMandiArbitrage) {
      headline = `बाजार समिती पर्याय: ${alternativeMandi?.market} मध्ये ₹${alternativeMandi?.modalPrice - currentPrice}/Qtl जास्तीचा दर`;
      advisoryType = 'INTER_MANDI_ARBITRAGE';
      recommendedAction = 'SELL_DIFFERENT_MANDI';
    } else {
      headline = `विक्री सल्ला: सध्याचा भाव ₹${currentPrice}/Qtl फायदेशीर, त्वरित विक्री योग्य`;
      advisoryType = 'PRICE_SPIKE';
      recommendedAction = 'SELL_NOW';
    }

    // Marathi Script
    const messageMarathi = isStorageFavorable
      ? `नमस्कार ${farmer.name} भाऊ, शेतकरी निर्णय प्रणालीकडून सूचना: आज ${mandi.market} मध्ये ${commodity} भाव ₹${currentPrice} आहे. ${storageFacility?.name || 'जवळच्या कोल्ड स्टोरेज'} मध्ये ${storageDurationMonths} महिने साठवणूक केल्यास आपला ब्रेक-इव्हन भाव ₹${breakEven} राहील. अंदाजे ₹${Math.round(estimatedNetGain).toLocaleString('en-IN')} नफा अपेक्षित आहे.`
      : `नमस्कार ${farmer.name} भाऊ: आजच्या बाजारभावानुसार साठवणूक खर्चापेक्षा सध्याचा बाजारभाव ₹${currentPrice} वर विक्री करणे अधिक फायदेशीर ठरत आहे.`;

    // Hindi Script
    const messageHindi = isStorageFavorable
      ? `नमस्ते ${farmer.name} जी, किसान निर्णय सहायता से संदेश: आज ${mandi.market} में ${commodity} का भाव ₹${currentPrice} है। कोल्ड स्टोरेज में ${storageDurationMonths} महीने रखने पर ब्रेक-ईवन भाव ₹${breakEven} रहेगा। लगभग ₹${Math.round(estimatedNetGain).toLocaleString('en-IN')} का शुद्ध लाभ संभव है।`
      : `नमस्ते ${farmer.name} जी: वर्तमान मंडी भाव ₹${currentPrice} पर तुरंत बेचना भंडारण खर्च की तुलना में अधिक सुरक्षित और लाभकारी है।`;

    // English Script
    const messageEnglish = isStorageFavorable
      ? `Hello ${farmer.name}, Decision Support Alert: Current ${mandi.market} ${commodity} modal price is ₹${currentPrice}/Qtl. Storing ${qty} quintals for ${storageDurationMonths} months puts break-even at ₹${breakEven}/Qtl, with a projected net surplus of ₹${Math.round(estimatedNetGain).toLocaleString('en-IN')}.`
      : `Hello ${farmer.name}: Current market realization at ₹${currentPrice}/Qtl in ${mandi.market} offers safer net returns than carrying warehouse holding costs.`;

    return {
      id: `adv-${Date.now()}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      crop: commodity,
      marketName: mandi.market,
      triggerEvent: `Automated analysis for ${commodity} at ${mandi.market} (Modal: ₹${currentPrice}/Qtl)`,
      advisoryType,
      headline,
      messageMarathi,
      messageHindi,
      messageEnglish,
      generatedAt: new Date().toISOString(),
      callStatus: 'completed',
      callDurationSeconds: 45,
      keyInsights: {
        recommendedAction,
        estimatedNetGainINR: Math.round(estimatedNetGain),
        breakEvenPriceINR: Math.round(breakEven),
      },
      isDemo: true,
    };
  },
};
