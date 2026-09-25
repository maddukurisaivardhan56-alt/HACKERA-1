import {
  FarmerProfile,
  MandiPriceRecord,
  ColdStorageFacility,
  StorageEnquiry,
  AdvisoryRecord,
  EventDetectionRule,
} from '../types';
import { INITIAL_FARMERS } from './initialFarmers';
import { INITIAL_MANDI_PRICES } from './initialMandis';
import { INITIAL_STORAGE_FACILITIES } from './initialStorage';
import { INITIAL_ADVISORIES, INITIAL_EVENT_RULES } from './initialEvents';

const KEYS = {
  FARMERS: 'fg_demo_farmers_v1',
  MANDIS: 'fg_demo_mandis_v1',
  STORAGE: 'fg_demo_storage_v1',
  ENQUIRIES: 'fg_demo_enquiries_v1',
  ADVISORIES: 'fg_demo_advisories_v1',
  EVENT_RULES: 'fg_demo_event_rules_v1',
  ACTIVE_FARMER_ID: 'fg_demo_active_farmer_v1',
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export const MockStore = {
  getFarmers: (): FarmerProfile[] => {
    const local = getLocal<FarmerProfile[]>(KEYS.FARMERS, INITIAL_FARMERS);
    const existingMap = new Map<string, FarmerProfile>();
    INITIAL_FARMERS.forEach((f) => existingMap.set(f.id, { ...f }));
    local.forEach((f) => {
      const existing = existingMap.get(f.id);
      if (existing) {
        existingMap.set(f.id, { ...existing, ...f, status: 'Active', consentForAdvisory: true });
      } else {
        existingMap.set(f.id, { ...f, status: 'Active', consentForAdvisory: true });
      }
    });
    const merged = Array.from(existingMap.values());
    return merged;
  },
  saveFarmers: (data: FarmerProfile[]) => setLocal(KEYS.FARMERS, data),

  getMandis: (): MandiPriceRecord[] => getLocal(KEYS.MANDIS, INITIAL_MANDI_PRICES),
  saveMandis: (data: MandiPriceRecord[]) => setLocal(KEYS.MANDIS, data),

  getStorageFacilities: (): ColdStorageFacility[] =>
    getLocal(KEYS.STORAGE, INITIAL_STORAGE_FACILITIES),
  saveStorageFacilities: (data: ColdStorageFacility[]) => setLocal(KEYS.STORAGE, data),

  getEnquiries: (): StorageEnquiry[] =>
    getLocal(KEYS.ENQUIRIES, [
      {
        id: 'enq-001',
        farmerId: 'FG-MH-001',
        farmerName: 'Ramesh Patil',
        farmerPhone: '9822012345',
        facilityId: 'cs-001',
        facilityName: 'Sahyadri Agro Cold Storage & Integrated Packhouse',
        crop: 'Onion',
        quantityQuintals: 150,
        requestedDurationMonths: 3,
        preferredStartDate: '2026-09-25',
        status: 'acknowledged',
        submittedAt: '2026-09-17T11:30:00Z',
        notes: 'Requested CIPC anti-sprouting chamber slot',
        isSimulated: true,
      },
    ]),
  saveEnquiries: (data: StorageEnquiry[]) => setLocal(KEYS.ENQUIRIES, data),

  getAdvisories: (): AdvisoryRecord[] => getLocal(KEYS.ADVISORIES, INITIAL_ADVISORIES),
  saveAdvisories: (data: AdvisoryRecord[]) => setLocal(KEYS.ADVISORIES, data),

  getEventRules: (): EventDetectionRule[] => getLocal(KEYS.EVENT_RULES, INITIAL_EVENT_RULES),
  saveEventRules: (data: EventDetectionRule[]) => setLocal(KEYS.EVENT_RULES, data),

  getActiveFarmerId: (): string => getLocal(KEYS.ACTIVE_FARMER_ID, 'FG-MH-001'),
  setActiveFarmerId: (id: string) => setLocal(KEYS.ACTIVE_FARMER_ID, id),

  resetAllToDefault: () => {
    try {
      localStorage.removeItem(KEYS.FARMERS);
      localStorage.removeItem(KEYS.MANDIS);
      localStorage.removeItem(KEYS.STORAGE);
      localStorage.removeItem(KEYS.ENQUIRIES);
      localStorage.removeItem(KEYS.ADVISORIES);
      localStorage.removeItem(KEYS.EVENT_RULES);
      localStorage.removeItem(KEYS.ACTIVE_FARMER_ID);
    } catch {}
  },
};
