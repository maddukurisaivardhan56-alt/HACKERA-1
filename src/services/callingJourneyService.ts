import {
  FarmerCallingRecord,
  AICallingJourneyStage,
  IndividualCallStatus,
  FarmerCallLog,
  FarmerSupportRequest,
  AgricultureOfficerProfile,
  FarmerProfile,
} from '../types';
import { INITIAL_FARMER_CALLING_RECORDS, LOGGED_IN_OFFICER } from '../data/initialOfficerProfile';
import { INITIAL_SUPPORT_REQUESTS } from '../data/initialOfficerData';

const CALLING_STORAGE_KEY = 'fg_calling_journey_records_v1';
const OFFICER_STORAGE_KEY = 'fg_officer_profile_v1';

export const STAGES_ORDER: AICallingJourneyStage[] = [
  '1. Government Registration',
  '2. Initial AI Call',
  '3. Farmer & Crop Interaction',
  '4. Weather Updates',
  '5. Market Price Updates',
  '6. Cold Storage Updates',
];

export const CallingJourneyService = {
  getOfficerProfile(): AgricultureOfficerProfile {
    try {
      const saved = localStorage.getItem(OFFICER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : LOGGED_IN_OFFICER;
    } catch {
      return LOGGED_IN_OFFICER;
    }
  },

  saveOfficerProfile(profile: Partial<AgricultureOfficerProfile>): AgricultureOfficerProfile {
    const current = this.getOfficerProfile();
    const updated: AgricultureOfficerProfile = { ...current, ...profile };
    try {
      localStorage.setItem(OFFICER_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('fg_officer_profile_updated'));
    } catch (e) {
      console.warn('LocalStorage officer profile save error:', e);
    }
    return updated;
  },

  getRecords(): FarmerCallingRecord[] {
    try {
      const saved = localStorage.getItem(CALLING_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_FARMER_CALLING_RECORDS;
    } catch {
      return INITIAL_FARMER_CALLING_RECORDS;
    }
  },

  saveRecords(records: FarmerCallingRecord[]): void {
    try {
      localStorage.setItem(CALLING_STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new Event('fg_calling_records_updated'));
    } catch (e) {
      console.warn('LocalStorage calling records save error:', e);
    }
  },

  resetToInitial(): void {
    localStorage.removeItem(CALLING_STORAGE_KEY);
    localStorage.removeItem(OFFICER_STORAGE_KEY);
    window.dispatchEvent(new Event('fg_calling_records_updated'));
    window.dispatchEvent(new Event('fg_officer_profile_updated'));
  },

  getNextStage(currentStage: AICallingJourneyStage): AICallingJourneyStage | null {
    const idx = STAGES_ORDER.indexOf(currentStage);
    if (idx >= 0 && idx < STAGES_ORDER.length - 1) {
      return STAGES_ORDER[idx + 1];
    }
    return null;
  },

  /**
   * Automatically initiate initial AI call after registration,
   * strictly subject to farmer consent and calling preferences.
   */
  autoInitiateInitialCall(farmerId: string): FarmerCallingRecord[] {
    const records = this.getRecords();
    const updated = records.map((record) => {
      if (record.farmerId === farmerId) {
        if (!record.consentForAdvisory) {
          return {
            ...record,
            callStatus: 'Not Started' as IndividualCallStatus,
          };
        }
        // Advance from Registration to Initial Call
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toISOString().split('T')[0];

        const newLog: FarmerCallLog = {
          id: `cl-${Date.now().toString().slice(-6)}`,
          stage: '2. Initial AI Call',
          status: 'Scheduled',
          timestamp: `${dateStr} ${timeStr}`,
          summary: 'Auto-initiated introductory voice onboarding call following verified registration.',
        };

        return {
          ...record,
          currentStage: '2. Initial AI Call' as AICallingJourneyStage,
          callStatus: 'Scheduled' as IndividualCallStatus,
          lastCallDate: dateStr,
          lastCallTime: timeStr,
          callHistory: [newLog, ...record.callHistory],
        };
      }
      return record;
    });

    this.saveRecords(updated);
    return updated;
  },

  /**
   * Execute an automated or admin-initiated call for a farmer
   */
  executeCall(farmerId: string, customOutcome?: 'Completed' | 'Failed'): FarmerCallingRecord[] {
    const records = this.getRecords();
    const updated = records.map((record) => {
      if (record.farmerId === farmerId) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toISOString().split('T')[0];

        const isSuccess = customOutcome ? customOutcome === 'Completed' : record.consentForAdvisory;

        if (isSuccess) {
          const nextStage = this.getNextStage(record.currentStage) || record.currentStage;
          const stageSummary = this.getStageSummary(record.currentStage, record.selectedCrop);

          const newLog: FarmerCallLog = {
            id: `cl-${Date.now().toString().slice(-6)}`,
            stage: record.currentStage,
            status: 'Completed',
            timestamp: `${dateStr} ${timeStr}`,
            durationSeconds: Math.floor(100 + Math.random() * 80),
            summary: stageSummary,
          };

          return {
            ...record,
            currentStage: nextStage,
            callStatus: 'Completed' as IndividualCallStatus,
            lastCallDate: dateStr,
            lastCallTime: timeStr,
            callHistory: [newLog, ...record.callHistory],
          };
        } else {
          const newLog: FarmerCallLog = {
            id: `cl-${Date.now().toString().slice(-6)}`,
            stage: record.currentStage,
            status: 'Failed',
            timestamp: `${dateStr} ${timeStr}`,
            durationSeconds: 0,
            summary: 'Call delivery attempt failed: Subscriber handset unavailable / No response.',
            failureReason: 'Gateway reported temporary network timeout (45s no answer).',
          };

          return {
            ...record,
            callStatus: 'Retry Needed' as IndividualCallStatus,
            lastCallDate: dateStr,
            lastCallTime: timeStr,
            callHistory: [newLog, ...record.callHistory],
          };
        }
      }
      return record;
    });

    this.saveRecords(updated);
    return updated;
  },

  /**
   * Admin manual retry for failed or retry-needed calls
   */
  retryCall(farmerId: string): FarmerCallingRecord[] {
    const records = this.getRecords();
    const updated = records.map((record) => {
      if (record.farmerId === farmerId) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toISOString().split('T')[0];

        // Successfully reconnects upon retry
        const nextStage = this.getNextStage(record.currentStage) || record.currentStage;
        const summary = `Manual admin retry successful: Reconnected with farmer regarding ${record.selectedCrop} (${record.currentStage}).`;

        const newLog: FarmerCallLog = {
          id: `cl-${Date.now().toString().slice(-6)}`,
          stage: record.currentStage,
          status: 'Completed',
          timestamp: `${dateStr} ${timeStr}`,
          durationSeconds: 125,
          summary,
        };

        return {
          ...record,
          currentStage: nextStage,
          callStatus: 'Completed' as IndividualCallStatus,
          lastCallDate: dateStr,
          lastCallTime: timeStr,
          callHistory: [newLog, ...record.callHistory],
        };
      }
      return record;
    });

    this.saveRecords(updated);
    return updated;
  },

  /**
   * When farmer reports a problem during an AI call:
   * Creates complaint in Farmer Support and sets appointment status.
   */
  reportProblemFromCall(params: {
    farmerId: string;
    farmerName: string;
    phone: string;
    village: string;
    taluka: string;
    district: string;
    crop: string;
    landAreaAcres: number;
    subject: string;
    description: string;
    appointmentAgreed: boolean;
    appointmentDate?: string;
    appointmentTime?: string;
  }): string {
    const complaintId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest: FarmerSupportRequest = {
      id: complaintId,
      farmerId: params.farmerId,
      farmerName: params.farmerName,
      phone: params.phone,
      village: params.village,
      taluka: params.taluka,
      district: params.district,
      crop: params.crop,
      landAreaAcres: params.landAreaAcres,
      subject: params.subject,
      issueCategory: 'Pest & Disease',
      description: params.description,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Open',
      priority: 'High',
      appointmentStatus: params.appointmentAgreed && params.appointmentDate ? 'Visit Scheduled' : 'Appointment Pending',
      appointmentDate: params.appointmentAgreed ? params.appointmentDate : undefined,
      appointmentTime: params.appointmentAgreed ? params.appointmentTime : undefined,
    };

    try {
      const saved = localStorage.getItem('fg_officer_support_requests');
      const list: FarmerSupportRequest[] = saved ? JSON.parse(saved) : [...INITIAL_SUPPORT_REQUESTS];
      localStorage.setItem('fg_officer_support_requests', JSON.stringify([newRequest, ...list]));
      window.dispatchEvent(new Event('fg_support_updated'));
    } catch (e) {
      console.error('Error saving support request from call:', e);
    }

    return complaintId;
  },

  getStageSummary(stage: AICallingJourneyStage, crop: string): string {
    switch (stage) {
      case '1. Government Registration':
        return `Government registration confirmed for ${crop} landholding extract.`;
      case '2. Initial AI Call':
        return `AI introductory call completed. Farmer confirmed preferred Marathi voice delivery.`;
      case '3. Farmer & Crop Interaction':
        return `Collected crop growth stage, acreage, and farm water source details for ${crop}.`;
      case '4. Weather Updates':
        return `Delivered localized weather advisory and humidity warning relevant to ${crop}.`;
      case '5. Market Price Updates':
        return `Delivered current APMC mandi modal price benchmarks and 7-day price forecast for ${crop}.`;
      case '6. Cold Storage Updates':
        return `Connected with nearby certified cold storage facilities and informed on storage subsidies.`;
      default:
        return `AI automated consultation completed successfully.`;
    }
  },

  /**
   * Register a newly onboarded farmer into the calling journey.
   * If consent is granted, automatically initiate the initial AI call (Stage 2).
   */
  registerFarmerIntoJourney(farmer: FarmerProfile): FarmerCallingRecord {
    const records = this.getRecords();
    const existing = records.find((r) => r.farmerId === farmer.id);
    if (existing) return existing;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const initialLog: FarmerCallLog = {
      id: `cl-${Date.now().toString().slice(-6)}`,
      stage: '1. Government Registration',
      status: 'Completed',
      timestamp: `${dateStr} ${timeStr}`,
      durationSeconds: 60,
      summary: `Farmer verified & registered via official portal. Consent: ${farmer.consentForAdvisory ? 'Granted' : 'Pending'}.`,
    };

    const newRecord: FarmerCallingRecord = {
      id: `fcr-${Date.now()}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      phone: farmer.phone,
      village: farmer.village,
      taluka: farmer.taluka,
      district: farmer.district,
      selectedCrop: farmer.primaryCrop || 'Onion',
      landAreaAcres: farmer.landAreaAcres || 1.0,
      consentForAdvisory: farmer.consentForAdvisory,
      preferredLanguage: farmer.preferredLanguage || 'mr',
      currentStage: farmer.consentForAdvisory ? '2. Initial AI Call' : '1. Government Registration',
      callStatus: farmer.consentForAdvisory ? 'Scheduled' : 'Not Started',
      lastCallDate: dateStr,
      lastCallTime: timeStr,
      collectedCropInfo: {
        soilType: 'Black Soil (Regur)',
        cropVariety: `${farmer.primaryCrop || 'Local'} Hybrid`,
        growthStage: 'Vegetative Growth',
        irrigationMethod: 'Drip Irrigation',
        estimatedHarvestMonth: 'Upcoming Season',
      },
      callHistory: [initialLog],
    };

    const updated = [newRecord, ...records];
    this.saveRecords(updated);
    return newRecord;
  },

  /**
   * Manually or programmatically advance farmer journey stage
   */
  advanceFarmerStage(farmerId: string, targetStage: AICallingJourneyStage): FarmerCallingRecord[] {
    const records = this.getRecords();
    const updated = records.map((record) => {
      if (record.farmerId === farmerId) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toISOString().split('T')[0];
        const stageSummary = this.getStageSummary(targetStage, record.selectedCrop);

        const newLog: FarmerCallLog = {
          id: `cl-${Date.now().toString().slice(-6)}`,
          stage: targetStage,
          status: 'Completed',
          timestamp: `${dateStr} ${timeStr}`,
          durationSeconds: 110,
          summary: `Stage updated to ${targetStage}. ${stageSummary}`,
        };

        return {
          ...record,
          currentStage: targetStage,
          callStatus: 'Completed' as IndividualCallStatus,
          lastCallDate: dateStr,
          lastCallTime: timeStr,
          callHistory: [newLog, ...record.callHistory],
        };
      }
      return record;
    });

    this.saveRecords(updated);
    return updated;
  },

  /**
   * Run automated routine broadcast/advisory calls across all eligible farmers in this stage
   */
  batchRunRoutineCalls(targetStage: '4. Weather Updates' | '5. Market Price Updates' | '6. Cold Storage Updates'): { triggeredCount: number } {
    const records = this.getRecords();
    let triggeredCount = 0;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const updated = records.map((record) => {
      // If farmer is in this stage or has consented and ready for updates
      if (record.consentForAdvisory && (record.currentStage === targetStage || record.callStatus === 'Scheduled')) {
        triggeredCount++;
        const stageSummary = this.getStageSummary(targetStage, record.selectedCrop);
        const newLog: FarmerCallLog = {
          id: `cl-${Date.now().toString().slice(-6)}-${triggeredCount}`,
          stage: targetStage,
          status: 'Completed',
          timestamp: `${dateStr} ${timeStr}`,
          durationSeconds: Math.floor(95 + Math.random() * 50),
          summary: `Automated routine call delivered: ${stageSummary}`,
        };

        const next = this.getNextStage(targetStage) || targetStage;

        return {
          ...record,
          currentStage: next,
          callStatus: 'Completed' as IndividualCallStatus,
          lastCallDate: dateStr,
          lastCallTime: timeStr,
          callHistory: [newLog, ...record.callHistory],
        };
      }
      return record;
    });

    if (triggeredCount > 0) {
      this.saveRecords(updated);
    }
    return { triggeredCount };
  },
};
