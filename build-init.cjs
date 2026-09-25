const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created: ' + relPath);
}

// 1. types/index.ts
writeFile('src/types/index.ts', \
export type UserRole = 'farmer' | 'admin';

export type Language = 'mr' | 'hi' | 'en';

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  primaryCrop: string;
  landAreaAcres: number;
  expectedHarvestQuintals: number;
  preferredLanguage: Language;
  consentForAdvisory: boolean;
  registeredDate: string;
  avatarUrl?: string;
}

export interface MandiPriceRecord {
  id: string;
  commodity: string;
  state: string;
  district: string;
  market: string;
  minPrice: number; // ₹ per Quintal
  maxPrice: number; // ₹ per Quintal
  modalPrice: number; // ₹ per Quintal
  unit: string; // 'Quintal' | 'Kg'
  distanceKm?: number; // Distance from selected farmer location
  arrivalQuantityQuintals: number;
  variety: string;
  grade: string;
  source: string;
  reportedDate: string; // ISO date string YYYY-MM-DD
  priceTrendPct7d?: number; // 7-day trend percentage
}

export interface HistoricalPricePoint {
  date: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  arrivalQty: number;
}

export interface ColdStorageFacility {
  id: string;
  name: string;
  district: string;
  location: string;
  contactPerson: string;
  contactPhone: string;
  distanceKm: number;
  ratePerQuintalMonth: number; // ₹/Qtl/Month
  handlingCostPerQuintal: number; // ₹/Qtl
  totalCapacityMT: number; // Metric Tonnes
  availableCapacityMT: number;
  suitableCrops: string[];
  features: string[]; // e.g. ['CIPC Treated', 'Dehumidified', 'Warehouse Receipt Financing']
  temperatureRange: string;
  humidityRange: string;
  rating: number;
}

export interface StorageEnquiry {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  facilityId: string;
  facilityName: string;
  crop: string;
  quantityQuintals: number;
  requestedDurationMonths: number;
  preferredStartDate: string;
  status: 'submitted' | 'acknowledged' | 'in_review' | 'facility_contacted';
  submittedAt: string;
  notes?: string;
  isSimulated: boolean;
}

export interface AdvisoryRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  marketName: string;
  triggerEvent: string;
  advisoryType: 'PRICE_SPIKE' | 'INTER_MANDI_ARBITRAGE' | 'STORAGE_FAVORABLE' | 'HARVEST_ALERT';
  headline: string;
  messageMarathi: string;
  messageHindi: string;
  messageEnglish: string;
  generatedAt: string;
  callStatus: 'initiated' | 'ringing' | 'connected' | 'completed' | 'failed' | 'scheduled';
  callDurationSeconds?: number;
  audioSimulatedUrl?: string;
  keyInsights: {
    recommendedAction: 'SELL_NOW' | 'STORE_AND_WAIT' | 'SELL_DIFFERENT_MANDI' | 'MONITOR';
    estimatedNetGainINR: number;
    breakEvenPriceINR: number;
  };
  isDemo: boolean;
}

export interface EventDetectionRule {
  id: string;
  name: string;
  commodity: string;
  conditionType: 'PRICE_DROP_STORAGE' | 'MANDI_SPREAD_ALERT' | 'BREAK_EVEN_CROSS' | 'STORAGE_RATE_DROP';
  thresholdValue: number;
  thresholdUnit: string;
  description: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  timesTriggered: number;
}

export interface SellOrStoreInputs {
  commodity: string;
  quantityQuintals: number;
  currentMandiPrice: number; // ₹/Quintal
  expectedFuturePrice: number; // ₹/Quintal
  storageDurationMonths: number;
  storageCostPerQuintalMonth: number; // ₹/Qtl/Month
  transportCostToStoragePerQuintal: number; // ₹/Qtl
  handlingCostPerQuintal: number; // ₹/Qtl (Loading/Unloading/Bags)
  spoilageLossPercentage: number; // % (Weight loss / moisture loss)
  opportunityInterestRatePctAnnual: number; // % Annual interest on working capital
}

export interface SellOrStoreResult {
  // Scenario A: Sell Now
  sellNowGrossValue: number;
  sellNowTransportCost: number;
  sellNowNetValue: number;
  
  // Scenario B: Store and Sell Later
  storeDurationMonths: number;
  effectiveQuantityAfterSpoilage: number;
  futureGrossSellingValue: number;
  totalDirectStorageCost: number;
  totalTransportCostToStorage: number;
  totalHandlingCost: number;
  estimatedSpoilageValueLoss: number;
  estimatedFinanceOpportunityCost: number;
  totalStorageRelatedCosts: number;
  storeAndSellNetValue: number;
  
  // Decision Metrics
  breakEvenFuturePricePerQuintal: number;
  netAdditionalGainINR: number;
  netGainPercentage: number;
  recommendedAction: 'SELL_NOW' | 'STORE_AND_WAIT' | 'NEUTRAL';
  confidenceRating: 'High' | 'Moderate' | 'Speculative';
  riskAnalysis: {
    priceDownsideRisk: number; // If future price is 10% lower than expected
    breakEvenMarginPct: number; // % above current price needed to break even
    keyAdvice: string;
  };
}
\);

console.log('Types created successfully');
