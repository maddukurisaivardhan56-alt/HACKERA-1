import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FarmerProfile,
  MandiPriceRecord,
  ColdStorageFacility,
  StorageEnquiry,
  StorageAppointmentRecord,
  AdvisoryRecord,
  EventDetectionRule,
  Language,
  AgricultureOfficerProfile,
  FarmerCallingRecord,
  AICallingJourneyStage,
} from '../types';
import { MockStore } from '../data/mockStore';
import { AuthService, AuthSession } from '../services/authService';
import { AdvisoryService, GenerateAdvisoryParams } from '../services/advisoryService';
import { CallingJourneyService } from '../services/callingJourneyService';
import { StorageAppointmentService } from '../services/storageAppointmentService';
import { getTranslation } from '../utils/translations';
import {
  SAFE_DEMO_FARMERS,
  SAFE_DEMO_PRIMARY_FARMER,
  SAFE_DEMO_CALLING_RECORDS,
  SAFE_DEMO_APPOINTMENTS,
} from '../data/demoData';

interface AppContextType {
  session: AuthSession;
  activeFarmer: FarmerProfile;
  isLoadingFarmer: boolean;
  farmerProfileError: string | null;
  refreshFarmerProfile: () => Promise<void>;
  farmers: FarmerProfile[];
  mandis: MandiPriceRecord[];
  storageFacilities: ColdStorageFacility[];
  enquiries: StorageEnquiry[];
  advisories: AdvisoryRecord[];
  eventRules: EventDetectionRule[];
  
  // Agriculture Officer Profile
  officer: AgricultureOfficerProfile;
  updateOfficerProfile: (profile: Partial<AgricultureOfficerProfile>) => void;

  // AI Calling Dashboard Journey & Records
  callingRecords: FarmerCallingRecord[];
  refreshCallingRecords: () => void;
  triggerCallForFarmer: (farmerId: string, customOutcome?: 'Completed' | 'Failed') => void;
  retryCallForFarmer: (farmerId: string) => void;
  advanceFarmerStage: (farmerId: string, targetStage: AICallingJourneyStage) => void;
  batchRunRoutineCalls: (targetStage: '4. Weather Updates' | '5. Market Price Updates' | '6. Cold Storage Updates') => { triggeredCount: number };

  // Language & Localization
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;

  // Auth actions
  loginAsFarmer: (phone: string, otp: string, sessionId?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: (email: string, pass: string) => { success: boolean; error?: string };
  loginAsStorageOwner: (email: string, pass: string) => { success: boolean; owner?: any; error?: string };
  loginAsDemo: (portal: 'farmer' | 'admin' | 'officer' | 'storage_owner') => void;
  logout: () => Promise<void> | void;
  setActiveFarmerId: (id: string) => void;

  // Demo Mode Protection
  isDemoMode: boolean;
  demoNotice: string | null;
  showDemoRestrictedToast: (msg?: string) => void;
  clearDemoNotice: () => void;

  // Cold Storage Appointments
  appointments: StorageAppointmentRecord[];
  refreshAppointments: () => Promise<void>;
  createStorageAppointment: (data: Omit<StorageAppointmentRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<StorageAppointmentRecord>;
  approveStorageAppointment: (id: string) => Promise<StorageAppointmentRecord>;
  rejectStorageAppointment: (id: string, reason: string) => Promise<StorageAppointmentRecord>;
  rescheduleStorageAppointment: (id: string, date: string, time: string, note?: string) => Promise<StorageAppointmentRecord>;
  respondToStorageReschedule: (id: string, accept: boolean, counterDate?: string, counterTime?: string, note?: string) => Promise<StorageAppointmentRecord>;

  // Farmer CRUD
  addFarmer: (farmer: Omit<FarmerProfile, 'id' | 'registeredDate'>) => void;
  updateFarmer: (farmer: FarmerProfile) => void;

  // Mandi CRUD & Import
  addMandiRecord: (record: Omit<MandiPriceRecord, 'id'>) => void;
  updateMandiRecord: (record: MandiPriceRecord) => void;
  deleteMandiRecord: (id: string) => void;
  importMandiRecords: (records: MandiPriceRecord[]) => void;

  // Cold Storage CRUD
  addStorageFacility: (facility: Omit<ColdStorageFacility, 'id'>) => void;
  updateStorageFacility: (facility: ColdStorageFacility) => void;
  deleteStorageFacility: (id: string) => void;

  // Storage Enquiry
  submitStorageEnquiry: (enquiry: Omit<StorageEnquiry, 'id' | 'submittedAt' | 'isSimulated'>) => StorageEnquiry;
  updateEnquiryStatus: (id: string, status: StorageEnquiry['status']) => void;

  // Advisory & Events
  triggerAdvisoryWorkflow: (params: GenerateAdvisoryParams) => AdvisoryRecord;
  addAdvisoryRecord: (record: AdvisoryRecord) => void;
  toggleEventRule: (id: string) => void;
  addEventRule: (rule: Omit<EventDetectionRule, 'id' | 'timesTriggered'>) => void;
  updateEventRule: (rule: EventDetectionRule) => void;
  deleteEventRule: (id: string) => void;

  // Reset
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>(() => AuthService.getCurrentSession());
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const showDemoRestrictedToast = (msg: string = 'This action is disabled in Demo Mode.') => {
    setDemoNotice(msg);
  };

  const clearDemoNotice = () => setDemoNotice(null);

  useEffect(() => {
    if (!demoNotice) return;
    const timer = setTimeout(() => {
      setDemoNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [demoNotice]);

  const isDemoMode = Boolean(session.isDemo && session.isAuthenticated);

  const [farmers, setFarmers] = useState<FarmerProfile[]>(() => {
    const cur = AuthService.getCurrentSession();
    if (cur.isDemo) return SAFE_DEMO_FARMERS;
    return MockStore.getFarmers();
  });
  const [activeFarmerId, setActiveFarmerIdState] = useState<string>(() => {
    const cur = AuthService.getCurrentSession();
    if (cur.isDemo) return 'DEMO-FARMER-01';
    return MockStore.getActiveFarmerId();
  });
  const [mandis, setMandis] = useState<MandiPriceRecord[]>(() => MockStore.getMandis());
  const [storageFacilities, setStorageFacilities] = useState<ColdStorageFacility[]>(() => MockStore.getStorageFacilities());
  const [enquiries, setEnquiries] = useState<StorageEnquiry[]>(() => MockStore.getEnquiries());
  const [advisories, setAdvisories] = useState<AdvisoryRecord[]>(() => MockStore.getAdvisories());
  const [eventRules, setEventRules] = useState<EventDetectionRule[]>(() => MockStore.getEventRules());

  // Agriculture Officer Profile
  const [officer, setOfficer] = useState<AgricultureOfficerProfile>(() => CallingJourneyService.getOfficerProfile());

  // AI Calling Dashboard records
  const [callingRecords, setCallingRecords] = useState<FarmerCallingRecord[]>(() => {
    const cur = AuthService.getCurrentSession();
    if (cur.isDemo) return SAFE_DEMO_CALLING_RECORDS;
    return CallingJourneyService.getRecords();
  });

  // Listen to cross-component calling journey & officer profile updates
  useEffect(() => {
    const handleRecordsUpdate = () => {
      setCallingRecords(CallingJourneyService.getRecords());
    };
    const handleOfficerUpdate = () => {
      setOfficer(CallingJourneyService.getOfficerProfile());
    };
    window.addEventListener('fg_calling_records_updated', handleRecordsUpdate);
    window.addEventListener('fg_officer_profile_updated', handleOfficerUpdate);
    return () => {
      window.removeEventListener('fg_calling_records_updated', handleRecordsUpdate);
      window.removeEventListener('fg_officer_profile_updated', handleOfficerUpdate);
    };
  }, []);

  // Dynamic Supabase farmer state
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [isLoadingFarmer, setIsLoadingFarmer] = useState<boolean>(true);
  const [farmerProfileError, setFarmerProfileError] = useState<string | null>(null);

  // Cold Storage Appointments state
  const [appointments, setAppointments] = useState<StorageAppointmentRecord[]>(() =>
    StorageAppointmentService.getAllLocal()
  );

  const refreshAppointments = async () => {
    try {
      const curSession = AuthService.getCurrentSession();
      if (curSession.role === 'storage_owner' && curSession.storageOwnerFacilityId) {
        const records = await StorageAppointmentService.getAppointmentsByFacility(curSession.storageOwnerFacilityId);
        setAppointments(records);
      } else if (curSession.role === 'farmer') {
        const fId = farmerProfile?.id || curSession.farmerId || 'FG-DEMO-001';
        const records = await StorageAppointmentService.getAppointmentsByFarmer(fId, curSession.farmerPhone);
        setAppointments(records);
      } else {
        setAppointments(StorageAppointmentService.getAllLocal());
      }
    } catch (e) {
      console.warn('Error refreshing appointments:', e);
    }
  };

  useEffect(() => {
    refreshAppointments();
    const handleUpdate = () => {
      refreshAppointments();
    };
    window.addEventListener('fg_appointments_updated', handleUpdate);
    return () => window.removeEventListener('fg_appointments_updated', handleUpdate);
  }, [session.role, session.storageOwnerFacilityId, session.farmerId, farmerProfile?.id]);

  // Global Language state (defaults to English when opened or refreshed)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, currentLanguage, fallback);
  };

  const refreshFarmerProfile = async () => {
    if (session.isDemo) {
      setFarmerProfile(SAFE_DEMO_PRIMARY_FARMER);
      setFarmers(SAFE_DEMO_FARMERS);
      setActiveFarmerIdState('DEMO-FARMER-01');
      setIsLoadingFarmer(false);
      setFarmerProfileError(null);
      return;
    }

    if (session.role === 'farmer' && session.isAuthenticated) {
      setIsLoadingFarmer(true);
      setFarmerProfileError(null);
      try {
        const res = await AuthService.getAuthenticatedFarmerProfile(session.farmerId, session.farmerPhone);
        if (res.success && res.farmer) {
          setFarmerProfile(res.farmer);
          setFarmers([res.farmer]);
          setActiveFarmerIdState(res.farmer.id);
          if (res.farmer.preferredLanguage) {
            setCurrentLanguage(res.farmer.preferredLanguage as Language);
          }
        } else {
          setFarmerProfile(null);
          setFarmerProfileError(res.error || 'No registered farmer record found in official database.');
        }
      } catch (err: any) {
        setFarmerProfile(null);
        setFarmerProfileError(err?.message || 'Database connection error.');
      } finally {
        setIsLoadingFarmer(false);
      }
    } else {
      setIsLoadingFarmer(false);
    }
  };

  useEffect(() => {
    refreshFarmerProfile();
  }, [session.farmerId, session.farmerPhone, session.isAuthenticated, session.role]);

  // Active farmer profile - strictly dynamic from authenticated Supabase farmer record
  const fallbackEmptyFarmer: FarmerProfile = {
    id: session.farmerId || 'PENDING',
    name: 'Authorized Farmer',
    phone: session.farmerPhone || '',
    state: 'Maharashtra',
    district: '',
    taluka: '',
    village: '',
    primaryCrop: 'Onion',
    landAreaAcres: 0,
    expectedHarvestQuintals: 0,
    preferredLanguage: currentLanguage,
    consentForAdvisory: true,
    registeredDate: new Date().toISOString().split('T')[0],
  };

  const activeFarmer: FarmerProfile =
    farmerProfile || (farmers.length > 0 ? farmers.find((f) => f.id === activeFarmerId) || farmers[0] : null) || fallbackEmptyFarmer;

  // Sync state to MockStore
  useEffect(() => {
    MockStore.saveFarmers(farmers);
  }, [farmers]);

  useEffect(() => {
    MockStore.saveMandis(mandis);
  }, [mandis]);

  useEffect(() => {
    MockStore.saveStorageFacilities(storageFacilities);
  }, [storageFacilities]);

  useEffect(() => {
    MockStore.saveEnquiries(enquiries);
  }, [enquiries]);

  useEffect(() => {
    MockStore.saveAdvisories(advisories);
  }, [advisories]);

  useEffect(() => {
    MockStore.saveEventRules(eventRules);
  }, [eventRules]);

  const setActiveFarmerId = (id: string) => {
    setActiveFarmerIdState(id);
    MockStore.setActiveFarmerId(id);
    // Optionally adapt language to farmer's preferred language if set
    const f = farmers.find((farm) => farm.id === id);
    if (f && f.preferredLanguage) {
      setLanguage(f.preferredLanguage);
    }
  };

  const loginAsFarmer = async (phone: string, otp: string, sessionId?: string) => {
    setIsLoadingFarmer(true);
    setFarmerProfileError(null);
    const res = await AuthService.verifyFarmerOTP(phone, otp, sessionId);
    if (res.success && res.farmer) {
      const authenticatedFarmer = res.farmer;
      setFarmerProfile(authenticatedFarmer);
      // Strictly isolate farmer dataset to this authenticated farmer only
      setFarmers([authenticatedFarmer]);
      setActiveFarmerIdState(authenticatedFarmer.id);
      setSession({
        role: 'farmer',
        farmerId: authenticatedFarmer.id,
        farmerPhone: authenticatedFarmer.phone,
        isAuthenticated: true,
      });
      if (authenticatedFarmer.preferredLanguage) {
        setLanguage(authenticatedFarmer.preferredLanguage as Language);
      }
      setIsLoadingFarmer(false);
      return { success: true };
    }
    setIsLoadingFarmer(false);
    setFarmerProfileError(res.error || 'Invalid OTP');
    return { success: false, error: res.error || 'Invalid OTP' };
  };

  const loginAsAdmin = (email: string, pass: string) => {
    const res = AuthService.loginAdmin(email, pass);
    if (res.success) {
      setSession({
        role: 'admin',
        adminEmail: email,
        isAuthenticated: true,
      });
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid credentials' };
  };

  const logout = async () => {
    await AuthService.logout();
    setFarmerProfile(null);
    setFarmers([]);
    setSession({
      role: 'farmer',
      farmerId: undefined,
      farmerPhone: undefined,
      isAuthenticated: false,
      isDemo: false,
    });
    setIsLoadingFarmer(false);
    setFarmerProfileError(null);
  };

  const loginAsDemo = (portal: 'farmer' | 'admin' | 'officer' | 'storage_owner') => {
    const newSession = AuthService.loginAsDemo(portal);
    setSession(newSession);

    if (portal === 'farmer') {
      setFarmerProfile(SAFE_DEMO_PRIMARY_FARMER);
      setFarmers(SAFE_DEMO_FARMERS);
      setActiveFarmerIdState('DEMO-FARMER-01');
      setAppointments(SAFE_DEMO_APPOINTMENTS.filter((a) => a.farmerId === 'DEMO-FARMER-01'));
      setIsLoadingFarmer(false);
      setFarmerProfileError(null);
    } else if (portal === 'admin' || portal === 'officer') {
      setFarmers(SAFE_DEMO_FARMERS);
      setCallingRecords(SAFE_DEMO_CALLING_RECORDS);
      setAppointments(SAFE_DEMO_APPOINTMENTS);
      setIsLoadingFarmer(false);
    } else if (portal === 'storage_owner') {
      setAppointments(SAFE_DEMO_APPOINTMENTS.filter((a) => a.facilityId === 'cs-001'));
      setIsLoadingFarmer(false);
    }
  };

  // Farmer actions
  const addFarmer = (newF: Omit<FarmerProfile, 'id' | 'registeredDate'>) => {
    if (session.isDemo) {
      showDemoRestrictedToast('This action is disabled in Demo Mode.');
      return;
    }
    const created: FarmerProfile = {
      ...newF,
      id: `FG-MH-00${farmers.length + 1}`,
      registeredDate: new Date().toISOString().split('T')[0],
    };
    setFarmers((prev) => [created, ...prev]);
    // Automatically register into calling journey and trigger initial call if consent given
    CallingJourneyService.registerFarmerIntoJourney(created);
    setCallingRecords(CallingJourneyService.getRecords());
  };

  const updateFarmer = (updated: FarmerProfile) => {
    if (session.isDemo) {
      showDemoRestrictedToast('This action is disabled in Demo Mode.');
      return;
    }
    setFarmers((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  // Mandi actions
  const addMandiRecord = (rec: Omit<MandiPriceRecord, 'id'>) => {
    const created: MandiPriceRecord = {
      ...rec,
      id: `mandi-${Date.now()}`,
    };
    setMandis((prev) => [created, ...prev]);
  };

  const updateMandiRecord = (rec: MandiPriceRecord) => {
    setMandis((prev) => prev.map((m) => (m.id === rec.id ? rec : m)));
  };

  const deleteMandiRecord = (id: string) => {
    setMandis((prev) => prev.filter((m) => m.id !== id));
  };

  const importMandiRecords = (newRecords: MandiPriceRecord[]) => {
    setMandis((prev) => [...newRecords, ...prev]);
  };

  // Cold Storage actions
  const addStorageFacility = (fac: Omit<ColdStorageFacility, 'id'>) => {
    const created: ColdStorageFacility = {
      ...fac,
      id: `cs-${Date.now()}`,
    };
    setStorageFacilities((prev) => [created, ...prev]);
  };

  const updateStorageFacility = (fac: ColdStorageFacility) => {
    setStorageFacilities((prev) => prev.map((s) => (s.id === fac.id ? fac : s)));
  };

  const deleteStorageFacility = (id: string) => {
    setStorageFacilities((prev) => prev.filter((s) => s.id !== id));
  };

  // Enquiry actions
  const submitStorageEnquiry = (
    data: Omit<StorageEnquiry, 'id' | 'submittedAt' | 'isSimulated'>
  ): StorageEnquiry => {
    const created: StorageEnquiry = {
      ...data,
      id: `enq-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      isSimulated: true,
    };
    setEnquiries((prev) => [created, ...prev]);
    return created;
  };

  const updateEnquiryStatus = (id: string, status: StorageEnquiry['status']) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  // Cold Storage Appointments actions
  const loginAsStorageOwner = (email: string, pass: string) => {
    const result = AuthService.loginStorageOwner(email, pass);
    if (result.success) {
      setSession(AuthService.getCurrentSession());
    }
    return result;
  };

  const createStorageAppointment = async (
    data: Omit<StorageAppointmentRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    const created = await StorageAppointmentService.createAppointment(data);
    await refreshAppointments();
    return created;
  };

  const approveStorageAppointment = async (id: string) => {
    const updated = await StorageAppointmentService.approveAppointment(id);
    await refreshAppointments();
    return updated;
  };

  const rejectStorageAppointment = async (id: string, reason: string) => {
    const updated = await StorageAppointmentService.rejectAppointment(id, reason);
    await refreshAppointments();
    return updated;
  };

  const rescheduleStorageAppointment = async (id: string, date: string, time: string, note?: string) => {
    const updated = await StorageAppointmentService.suggestAlternativeTime(id, date, time, note);
    await refreshAppointments();
    return updated;
  };

  const respondToStorageReschedule = async (
    id: string,
    accept: boolean,
    counterDate?: string,
    counterTime?: string,
    note?: string
  ) => {
    let updated: StorageAppointmentRecord;
    if (accept) {
      updated = await StorageAppointmentService.farmerAcceptAlternative(id);
    } else {
      updated = await StorageAppointmentService.farmerCounterPropose(id, counterDate || '', counterTime || '', note);
    }
    await refreshAppointments();
    return updated;
  };

  // Advisory & Event actions
  const triggerAdvisoryWorkflow = (params: GenerateAdvisoryParams): AdvisoryRecord => {
    const adv = AdvisoryService.generateAdvisory(params);
    setAdvisories((prev) => [adv, ...prev]);
    return adv;
  };

  const addAdvisoryRecord = (record: AdvisoryRecord) => {
    setAdvisories((prev) => [record, ...prev]);
  };

  const toggleEventRule = (id: string) => {
    setEventRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const addEventRule = (rule: Omit<EventDetectionRule, 'id' | 'timesTriggered'>) => {
    const created: EventDetectionRule = {
      ...rule,
      id: `rule-00${eventRules.length + 1}`,
      timesTriggered: 0,
    };
    setEventRules((prev) => [created, ...prev]);
  };

  const updateEventRule = (rule: EventDetectionRule) => {
    setEventRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
  };

  const deleteEventRule = (id: string) => {
    setEventRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Agriculture Officer Profile actions
  const updateOfficerProfile = (profile: Partial<AgricultureOfficerProfile>) => {
    if (session.isDemo) {
      showDemoRestrictedToast('This action is disabled in Demo Mode.');
      return;
    }
    const updated = CallingJourneyService.saveOfficerProfile(profile);
    setOfficer(updated);
  };

  // Calling Journey actions
  const refreshCallingRecords = () => {
    setCallingRecords(CallingJourneyService.getRecords());
  };

  const triggerCallForFarmer = (farmerId: string, customOutcome?: 'Completed' | 'Failed') => {
    const updated = CallingJourneyService.executeCall(farmerId, customOutcome);
    setCallingRecords(updated);
  };

  const retryCallForFarmer = (farmerId: string) => {
    const updated = CallingJourneyService.retryCall(farmerId);
    setCallingRecords(updated);
  };

  const advanceFarmerStage = (farmerId: string, targetStage: AICallingJourneyStage) => {
    const updated = CallingJourneyService.advanceFarmerStage(farmerId, targetStage);
    setCallingRecords(updated);
  };

  const batchRunRoutineCalls = (targetStage: '4. Weather Updates' | '5. Market Price Updates' | '6. Cold Storage Updates') => {
    const res = CallingJourneyService.batchRunRoutineCalls(targetStage);
    setCallingRecords(CallingJourneyService.getRecords());
    return res;
  };

  const resetDemoData = () => {
    MockStore.resetAllToDefault();
    CallingJourneyService.resetToInitial();
    setFarmers(MockStore.getFarmers());
    setMandis(MockStore.getMandis());
    setStorageFacilities(MockStore.getStorageFacilities());
    setEnquiries(MockStore.getEnquiries());
    setAdvisories(MockStore.getAdvisories());
    setEventRules(MockStore.getEventRules());
    setOfficer(CallingJourneyService.getOfficerProfile());
    setCallingRecords(CallingJourneyService.getRecords());
    setActiveFarmerId('FG-MH-001');
  };

  return (
    <AppContext.Provider
      value={{
        session,
        activeFarmer,
        isLoadingFarmer,
        farmerProfileError,
        refreshFarmerProfile,
        farmers,
        mandis,
        storageFacilities,
        enquiries,
        advisories,
        eventRules,
        officer,
        updateOfficerProfile,
        callingRecords,
        refreshCallingRecords,
        triggerCallForFarmer,
        retryCallForFarmer,
        advanceFarmerStage,
        batchRunRoutineCalls,
        currentLanguage,
        setLanguage,
        t,
        loginAsFarmer,
        loginAsAdmin,
        loginAsStorageOwner,
        loginAsDemo,
        logout,
        setActiveFarmerId,
        isDemoMode,
        demoNotice,
        showDemoRestrictedToast,
        clearDemoNotice,
        appointments,
        refreshAppointments,
        createStorageAppointment,
        approveStorageAppointment,
        rejectStorageAppointment,
        rescheduleStorageAppointment,
        respondToStorageReschedule,
        addFarmer,
        updateFarmer,
        addMandiRecord,
        updateMandiRecord,
        deleteMandiRecord,
        importMandiRecords,
        addStorageFacility,
        updateStorageFacility,
        deleteStorageFacility,
        submitStorageEnquiry,
        updateEnquiryStatus,
        triggerAdvisoryWorkflow,
        addAdvisoryRecord,
        toggleEventRule,
        addEventRule,
        updateEventRule,
        deleteEventRule,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
