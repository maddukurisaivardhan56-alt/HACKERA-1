import { SellOrStoreInputs, SellOrStoreResult } from '../types';

/**
 * Core mathematical engine for agricultural sell-now vs store-and-sell decision support.
 * Calculates transparent, multi-factor cost breakdowns including storage rent, handling,
 * freight to storage vs local mandi, physical shrinkage/moisture loss, and capital carrying cost.
 */
export function calculateSellOrStoreDecision(inputs: SellOrStoreInputs): SellOrStoreResult {
  const {
    quantityQuintals,
    currentMandiPrice,
    expectedFuturePrice,
    storageDurationMonths,
    storageCostPerQuintalMonth,
    transportCostToStoragePerQuintal,
    handlingCostPerQuintal,
    spoilageLossPercentage = 4,
    opportunityInterestRatePctAnnual = 9.0,
  } = inputs;

  const validQty = Math.max(0.1, quantityQuintals);
  const validCurrentPrice = Math.max(0, currentMandiPrice);
  const validFuturePrice = Math.max(0, expectedFuturePrice);
  const validMonths = Math.max(0.5, storageDurationMonths);

  // 1. SCENARIO A: SELL NOW AT LOCAL MANDI
  const localMandiCartagePerQtl = 25;
  const sellNowGrossValue = validQty * validCurrentPrice;
  const sellNowTransportCost = validQty * localMandiCartagePerQtl;
  const sellNowNetValue = Math.max(0, sellNowGrossValue - sellNowTransportCost);

  // 2. SCENARIO B: STORE IN WAREHOUSE & SELL LATER
  const spoilageFraction = Math.min(0.25, Math.max(0, spoilageLossPercentage / 100));
  const effectiveQuantityAfterSpoilage = validQty * (1 - spoilageFraction);

  const futureGrossSellingValue = effectiveQuantityAfterSpoilage * validFuturePrice;
  const totalDirectStorageCost = validQty * storageCostPerQuintalMonth * validMonths;
  const totalTransportCostToStorage = validQty * transportCostToStoragePerQuintal;
  const totalHandlingCost = validQty * handlingCostPerQuintal;

  const lostQuintals = validQty * spoilageFraction;
  const estimatedSpoilageValueLoss = lostQuintals * validCurrentPrice;

  const monthlyInterestRate = (opportunityInterestRatePctAnnual / 100) / 12;
  const estimatedFinanceOpportunityCost = sellNowGrossValue * monthlyInterestRate * validMonths;

  const totalStorageRelatedCosts =
    totalDirectStorageCost +
    totalTransportCostToStorage +
    totalHandlingCost +
    estimatedFinanceOpportunityCost;

  const storeAndSellNetValue = Math.max(
    0,
    futureGrossSellingValue - totalStorageRelatedCosts
  );

  const breakEvenFuturePricePerQuintal =
    effectiveQuantityAfterSpoilage > 0
      ? (sellNowNetValue + totalStorageRelatedCosts) / effectiveQuantityAfterSpoilage
      : validCurrentPrice * 1.3;

  const netAdditionalGainINR = storeAndSellNetValue - sellNowNetValue;
  const netGainPercentage =
    sellNowNetValue > 0 ? (netAdditionalGainINR / sellNowNetValue) * 100 : 0;

  let recommendedAction: 'SELL_NOW' | 'STORE_AND_WAIT' | 'NEUTRAL' = 'NEUTRAL';
  let confidenceRating: 'High' | 'Moderate' | 'Speculative' = 'Moderate';

  if (netAdditionalGainINR > 5000 && netGainPercentage >= 8) {
    recommendedAction = 'STORE_AND_WAIT';
    confidenceRating = netGainPercentage > 20 ? 'High' : 'Moderate';
  } else if (netAdditionalGainINR < -2000 || netGainPercentage <= -3) {
    recommendedAction = 'SELL_NOW';
    confidenceRating = netGainPercentage < -10 ? 'High' : 'Moderate';
  } else {
    recommendedAction = 'NEUTRAL';
    confidenceRating = 'Moderate';
  }

  const stressedFuturePrice = validFuturePrice * 0.90;
  const stressedNetValue =
    effectiveQuantityAfterSpoilage * stressedFuturePrice - totalStorageRelatedCosts;
  const priceDownsideRisk = stressedNetValue - sellNowNetValue;

  const breakEvenMarginPct =
    validCurrentPrice > 0
      ? ((breakEvenFuturePricePerQuintal - validCurrentPrice) / validCurrentPrice) * 100
      : 0;

  let keyAdvice = '';
  if (recommendedAction === 'STORE_AND_WAIT') {
    keyAdvice = `Storing offers an estimated net surplus of ₹${Math.round(
      netAdditionalGainINR
    ).toLocaleString('en-IN')} (${netGainPercentage.toFixed(1)}% gain over immediate sale). Future price must stay above ₹${Math.round(
      breakEvenFuturePricePerQuintal
    )}/Qtl.`;
  } else if (recommendedAction === 'SELL_NOW') {
    keyAdvice = `Immediate sale is financially safer. Holding adds ₹${Math.round(
      totalStorageRelatedCosts / validQty
    )}/Qtl in storage and carrying costs, creating an estimated loss of ₹${Math.abs(
      Math.round(netAdditionalGainINR)
    ).toLocaleString('en-IN')}.`;
  } else {
    keyAdvice = `Marginal differential (approx ₹${Math.round(
      netAdditionalGainINR
    ).toLocaleString('en-IN')}). If cash flow is needed immediately, selling now avoids market volatility risk.`;
  }

  return {
    sellNowGrossValue: Math.round(sellNowGrossValue),
    sellNowTransportCost: Math.round(sellNowTransportCost),
    sellNowNetValue: Math.round(sellNowNetValue),
    storeDurationMonths: validMonths,
    effectiveQuantityAfterSpoilage: Math.round(effectiveQuantityAfterSpoilage * 10) / 10,
    futureGrossSellingValue: Math.round(futureGrossSellingValue),
    totalDirectStorageCost: Math.round(totalDirectStorageCost),
    totalTransportCostToStorage: Math.round(totalTransportCostToStorage),
    totalHandlingCost: Math.round(totalHandlingCost),
    estimatedSpoilageValueLoss: Math.round(estimatedSpoilageValueLoss),
    estimatedFinanceOpportunityCost: Math.round(estimatedFinanceOpportunityCost),
    totalStorageRelatedCosts: Math.round(totalStorageRelatedCosts),
    storeAndSellNetValue: Math.round(storeAndSellNetValue),
    breakEvenFuturePricePerQuintal: Math.round(breakEvenFuturePricePerQuintal),
    netAdditionalGainINR: Math.round(netAdditionalGainINR),
    netGainPercentage: Math.round(netGainPercentage * 10) / 10,
    recommendedAction,
    confidenceRating,
    riskAnalysis: {
      priceDownsideRisk: Math.round(priceDownsideRisk),
      breakEvenMarginPct: Math.round(breakEvenMarginPct * 10) / 10,
      keyAdvice,
    },
  };
}
