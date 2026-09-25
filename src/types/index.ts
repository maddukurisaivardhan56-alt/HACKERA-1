export type UserRole = 'farmer' | 'admin' | 'storage_owner' | 'developer';

export type Language = 'mr' | 'hi' | 'en' | 'te';

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
  status?: 'Active' | 'Pending Verification' | 'Inactive' | 'Suspended';
  assignedOfficerId?: string;
  registeredByOfficerId?: string;
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

export type StorageAppointmentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Reschedule Requested';

export interface StorageAppointmentRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  facilityId: string;
  facilityName: string;
  crop: string;
  quantityQuintals: number;
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  proposedAlternativeDate?: string;
  proposedAlternativeTime?: string;
  rejectionReason?: string;
  additionalDetails?: string;
  status: StorageAppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CallExchange {
  speaker: 'ai' | 'farmer';
  textMarathi: string;
  textHindi: string;
  textEnglish: string;
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
  messageTelugu?: string;
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
  conversation?: CallExchange[];
  farmerDtmfResponse?: '1' | '2' | '3' | null;
  farmerDtmfActionText?: string;
  isCallWorthy?: boolean;
  firedTriggers?: string[];
}

export type DtmfResponseCode = '1' | '2' | '3';

export interface FarmerMonitoringProfile {
  farmerId: string;
  selectedCrops: string[];
  district: string;
  taluka: string;
  preferredMandi?: string;
  channelPreference: 'app' | 'ivr' | 'whatsapp';
  lastFarmerDecision?: 'SELL_NOW' | 'STORE' | 'CALL_AGAIN';
  cooldownUntil?: string;
  activeTriggersCount?: number;
  lastEvaluatedAt?: string;
}

export type TriggerRuleType =
  | 'trigger_price_drop'
  | 'trigger_price_rise'
  | 'trigger_storage_profitable'
  | 'trigger_storage_available';

export interface TriggerEvaluationResult {
  crop: string;
  mandi: string;
  currentPrice: number;
  sevenDayAvgPrice: number;
  priceChangePct: number;
  breakEvenPrice: number;
  storageNetBenefit: number;
  storageAvailableMT: number;
  isStorageProfitable: boolean;
  isStorageAvailable: boolean;
  firedTriggers: TriggerRuleType[];
  triggerDescriptions: string[];
  isCallWorthy: boolean;
  suppressedByCooldown: boolean;
  recommendedAction: 'SELL_NOW' | 'STORE_AND_WAIT' | 'MONITOR';
  llmDraftScript: {
    en: string;
    mr: string;
    hi: string;
    te: string;
  };
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
  sellNowGrossValue: number;
  sellNowTransportCost: number;
  sellNowNetValue: number;
  
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
  
  breakEvenFuturePricePerQuintal: number;
  netAdditionalGainINR: number;
  netGainPercentage: number;
  recommendedAction: 'SELL_NOW' | 'STORE_AND_WAIT' | 'NEUTRAL';
  confidenceRating: 'High' | 'Moderate' | 'Speculative';
  riskAnalysis: {
    priceDownsideRisk: number;
    breakEvenMarginPct: number;
    keyAdvice: string;
  };
}

export interface FarmerSupportRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  taluka?: string;
  district?: string;
  crop: string;
  landAreaAcres?: number;
  subject: string;
  issueCategory: 'Pest & Disease' | 'Nutrient Deficiency' | 'Irrigation & Weather' | 'Cultivation Practice' | 'Market Guidance';
  description: string;
  submittedDate: string;
  status: 'Open' | 'In Review' | 'Resolved' | 'Pending' | 'Visit Scheduled' | 'Visit Completed' | 'In Progress';
  officerGuidance?: string;
  priority: 'High' | 'Medium' | 'Low';
  appointmentStatus?: 'Appointment Pending' | 'Visit Scheduled' | 'Visit Completed';
  appointmentDate?: string;
  appointmentTime?: string;
  visitCompletedDate?: string;
}

export interface GovernmentScheme {
  id: string;
  code: string;
  name: string;
  department: string;
  category: 'Direct Income' | 'Crop Insurance' | 'Infrastructure & Irrigation' | 'Subsidies & Implements';
  description: string;
  subsidyAmount: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  officialPortalUrl: string;
  targetCrops: string[];
  maxLandHoldingAcres?: number;
  status: 'Active' | 'Upcoming' | 'Closed for Season';
  isNewScheme?: boolean;
  benefits?: string;
  applicationInfo?: string;
}

export type SchemeCallStatus = 'Pending' | 'Initiated' | 'Completed' | 'Failed' | 'No Answer';

export interface SchemeCallRecord {
  id: string;
  campaignId: string;
  schemeId: string;
  schemeName: string;
  schemeCode: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerLanguage: Language;
  village: string;
  taluka: string;
  crop: string;
  landAreaAcres: number;
  callStatus: SchemeCallStatus;
  initiatedAt: string;
  completedAt?: string;
  voiceScriptPreview: string;
  apiIntegrationNote?: string;
}

export interface FieldInspectionRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  crop: string;
  landAreaAcres: number;
  inspectionDate: string;
  cropGrowthStage: 'Sowing / Nursery' | 'Vegetative' | 'Bulb Development' | 'Flowering' | 'Pod Filling / Fruit Dev' | 'Maturity / Harvest Ready';
  observedHealth: 'Excellent' | 'Good' | 'Moderate' | 'Stressed' | 'Poor' | 'Critical';
  reportedIssues: string;
  officerRecommendations: string;
  officerName: string;
  followUpRequired: boolean;
  complaintId?: string;
  appointmentStatus?: 'Appointment Pending' | 'Visit Scheduled' | 'Visit Completed';
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface AgricultureOfficerProfile {
  id: string; // e.g. 'AO-MH-NSK-1042'
  name: string; // e.g. 'S. K. Kulkarni'
  designation: string; // e.g. 'Taluka Agriculture Officer (TAO)'
  department: string; // 'Department of Agriculture, Govt. of Maharashtra'
  officeLocation: string; // 'Sub-Divisional Krishi Bhavan, Niphad'
  assignedDistrict: string; // 'Nashik'
  assignedTaluka: string; // 'Niphad'
  assignedVillages: string[]; // ['Lasalgaon', 'Pimpalgaon', 'Ozar', 'Niphad Rural']
  phone: string;
  email: string;
}

export type AICallingJourneyStage =
  | '1. Government Registration'
  | '2. Initial AI Call'
  | '3. Farmer & Crop Interaction'
  | '4. Weather Updates'
  | '5. Market Price Updates'
  | '6. Cold Storage Updates';

export type IndividualCallStatus =
  | 'Not Started'
  | 'Scheduled'
  | 'Calling'
  | 'Connected'
  | 'Completed'
  | 'Failed'
  | 'Retry Needed';

export interface FarmerCallLog {
  id: string;
  callSid?: string;
  stage: AICallingJourneyStage;
  status: IndividualCallStatus;
  timestamp: string; // e.g. '2026-09-20 11:30 AM'
  durationSeconds?: number;
  summary: string;
  collectedCropInfo?: {
    growthStage?: string;
    soilCondition?: string;
    observedPests?: string;
    reportedProblem?: string;
    marketRequirement?: string;
  };
  failureReason?: string;
}

export interface FarmerCallingRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  selectedCrop: string;
  landAreaAcres: number;
  consentForAdvisory: boolean;
  preferredLanguage: Language;
  currentStage: AICallingJourneyStage;
  callStatus: IndividualCallStatus;
  lastCallDate?: string;
  lastCallTime?: string;
  nextScheduledCall?: string;
  callHistory: FarmerCallLog[];
  collectedCropInfo: {
    soilType?: string;
    cropVariety?: string;
    growthStage?: string;
    irrigationMethod?: string;
    estimatedHarvestMonth?: string;
    activeIssues?: string;
  };
}

export interface BulkCallResultItem {
  farmerId: string;
  farmerName: string;
  phone: string;
  status: 'queued' | 'calling' | 'completed' | 'failed' | 'skipped';
  callSid?: string;
  message?: string;
  error?: string;
  reason?: string;
}

export interface BulkCallBatchRecord {
  id: string;
  adminId: string;
  callPurpose: string;
  totalSelected: number;
  totalEligible: number;
  queuedCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  status: 'In Progress' | 'Completed' | 'Partial Failure' | 'Failed';
  results?: BulkCallResultItem[];
  createdAt: string;
}

export interface BulkMakeCallsPayload {
  farmerIds: string[];
  callPurpose: string;
  adminEmail?: string;
  batchId?: string;
}

export interface BulkMakeCallsResponse {
  success: boolean;
  batchId?: string;
  callPurpose?: string;
  totalSelected?: number;
  totalEligible?: number;
  queuedCount?: number;
  completedCount?: number;
  failedCount?: number;
  skippedCount?: number;
  results?: BulkCallResultItem[];
  error?: string;
  message?: string;
  note?: string;
}

export interface TelephonyStatusResponse {
  success: boolean;
  twilioConfigured: boolean;
  twilioPhoneNumber: string | null;
  maxBatchSize: number;
  cooldownMinutes: number;
  rateLimitDelayMs: number;
  note?: string;
}

// ============================================================================
// DEVELOPER PORTAL & CMS (CONTENT MANAGEMENT SYSTEM) TYPES
// ============================================================================

export interface CMSBrandingConfig {
  appName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryLogoUrl: string;
  secondaryLogoUrl: string;
}

export interface CMSThemeConfig {
  primaryColor: string;       // Fresh Green (#388E3C)
  secondaryColor: string;     // Sky Blue (#1976D2)
  accentColor: string;        // Orange (#F57C00)
  accentLightColor: string;   // Light Green (#C8E6C9)
  backgroundColor: string;    // Off-White (#FAFAFA)
  surfaceColor: string;       // White (#FFFFFF)
  textDarkColor: string;      // Dark Gray (#333333)
  textMutedColor: string;     // Medium Gray (#666666)
  borderColor: string;        // Light Gray (#E0E0E0)

  // Compatibility aliases
  textColor?: string;
  mutedTextColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
}

export interface CMSLandingFeature {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface CMSLandingStatistic {
  id: string;
  label: string;
  value: string;
  suffix?: string;
}

export interface CMSLandingConfig {
  heroHeading: string;
  heroDescription: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  featureSectionHeading: string;
  featureSectionSubheading: string;
  features: CMSLandingFeature[];
  statistics: CMSLandingStatistic[];
  footerNotice: string;
  newsItems?: string[];
}

export interface CMSLoginConfig {
  appName: string;
  welcomeHeading: string;
  welcomeSubtitle: string;
  farmerTabLabel: string;
  farmerDescription: string;
  adminTabLabel: string;
  adminDescription: string;
  officerTabLabel: string;
  officerDescription: string;
  storageOwnerTabLabel: string;
  storageOwnerDescription: string;
  signInButtonLabel: string;
  demoButtonLabel: string;
}

export interface CMSNavItem {
  id: string;
  label: string;
  path: string;
  isVisible: boolean;
  order: number;
}

export interface CMSNavigationConfig {
  farmerNav: CMSNavItem[];
  adminNav: CMSNavItem[];
  storageOwnerNav: CMSNavItem[];
}

export interface CMSFooterLink {
  id: string;
  label: string;
  url: string;
  openInNewTab: boolean;
}

export interface CMSFooterConfig {
  description: string;
  copyrightText: string;
  helplinePhone: string;
  supportEmail: string;
  officeAddress: string;
  links: CMSFooterLink[];
}

export interface CMSSystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  advisoryAlertsActive: boolean;
  enableLiveMarketFeed: boolean;
  demoModeActive: boolean;
}

export interface AppCMSConfig {
  branding: CMSBrandingConfig;
  theme: CMSThemeConfig;
  landing: CMSLandingConfig;
  login: CMSLoginConfig;
  navigation: CMSNavigationConfig;
  footer: CMSFooterConfig;
  system: CMSSystemConfig;
  updatedAt: string;
  updatedBy?: string;
}

export interface CMSAuditLog {
  id: string;
  developerId: string;
  developerEmail: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface DeveloperUser {
  id: string;
  email: string;
  fullName: string;
  role: 'developer';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface DeveloperSession {
  role: 'developer';
  developerEmail: string;
  developerId: string;
  developerName: string;
  token: string;
  isAuthenticated: boolean;
}

