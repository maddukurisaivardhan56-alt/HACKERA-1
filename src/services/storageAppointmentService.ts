import { StorageAppointmentRecord, StorageAppointmentStatus } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AuthService } from './authService';
import { SAFE_DEMO_APPOINTMENTS } from '../data/demoData';

const STORAGE_KEY = 'fg_storage_appointments_v3';
const DEMO_STORAGE_KEY = 'fg_demo_storage_appointments_v1';

function getDemoAppointments(): StorageAppointmentRecord[] {
  try {
    const stored = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SAFE_DEMO_APPOINTMENTS;
}

function saveDemoAppointments(records: StorageAppointmentRecord[]): void {
  try {
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('fg_appointments_updated'));
  } catch {}
}

// Initial realistic appointment requests linking existing test farmers to facilities
// All incoming requests start as 'Pending' so the owner can approve or reject each individually
const INITIAL_APPOINTMENTS: StorageAppointmentRecord[] = [
  {
    id: 'app-9812-001',
    farmerId: 'FG-DEMO-001',
    farmerName: 'MADDUKURI SAI VARDHAN',
    farmerPhone: '7993013756',
    facilityId: 'cs-001',
    facilityName: 'Sahyadri Agro Cold Storage & Integrated Packhouse',
    crop: 'ONION',
    quantityQuintals: 150,
    preferredDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTime: '10:30 AM',
    additionalDetails: 'Requesting anti-sprouting CIPC fogging for 3 months preservation.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-9812-002',
    farmerId: 'FG-DEMO-002',
    farmerName: 'BORRA AKHILA',
    farmerPhone: '9704316533',
    facilityId: 'cs-001',
    facilityName: 'Sahyadri Agro Cold Storage & Integrated Packhouse',
    crop: 'ONION',
    quantityQuintals: 180,
    preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTime: '11:00 AM',
    additionalDetails: 'Pre-sorted Grade-A red onion. Standard crates packing.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-9812-003',
    farmerId: 'FG-DEMO-003',
    farmerName: 'BORRA ALEKHYA',
    farmerPhone: '6303381553',
    facilityId: 'cs-001',
    facilityName: 'Sahyadri Agro Cold Storage & Integrated Packhouse',
    crop: 'ONION',
    quantityQuintals: 120,
    preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTime: '09:00 AM',
    additionalDetails: 'Standard onion mesh bags storage. Requesting Bay 2 ventilated section.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-9812-004',
    farmerId: 'FG-DEMO-004',
    farmerName: 'BUGGA PRATHIBA',
    farmerPhone: '7396972396',
    facilityId: 'cs-002',
    facilityName: 'Lasalgaon Kisan Shetkari Cold Chain Hub',
    crop: 'ONION',
    quantityQuintals: 90,
    preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTime: '03:00 PM',
    additionalDetails: 'High-pungency export red onion. Requires controlled humidity 65-70%.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export const StorageAppointmentService = {
  /**
   * Load all appointments from local storage or defaults
   */
  getAllLocal(): StorageAppointmentRecord[] {
    if (AuthService.isDemoSession()) {
      return getDemoAppointments();
    }
    try {
      // Clean up previous v1 cache so old pre-approved records don't persist
      localStorage.removeItem('fg_storage_appointments_v1');
      localStorage.removeItem('fg_storage_appointments_v2');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
    return INITIAL_APPOINTMENTS;
  },

  /**
   * Reset all appointments to initial fresh state where all requests are Pending
   */
  resetToDefaults(): StorageAppointmentRecord[] {
    if (AuthService.isDemoSession()) {
      sessionStorage.removeItem(DEMO_STORAGE_KEY);
      window.dispatchEvent(new Event('fg_appointments_updated'));
      return SAFE_DEMO_APPOINTMENTS;
    }
    try {
      localStorage.removeItem('fg_storage_appointments_v1');
      localStorage.removeItem('fg_storage_appointments_v2');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      window.dispatchEvent(new Event('fg_appointments_updated'));
    } catch {}
    return INITIAL_APPOINTMENTS;
  },

  /**
   * Save appointments list to local storage
   */
  saveLocal(records: StorageAppointmentRecord[]): void {
    if (AuthService.isDemoSession()) {
      saveDemoAppointments(records);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      // Dispatch storage event so other open tabs/windows sync immediately
      window.dispatchEvent(new Event('fg_appointments_updated'));
    } catch (e) {
      console.error('Failed to persist storage appointments:', e);
    }
  },

  /**
   * Fetch appointment requests for an authenticated farmer
   */
  async getAppointmentsByFarmer(farmerId: string, phone?: string): Promise<StorageAppointmentRecord[]> {
    if (AuthService.isDemoSession()) {
      const demoList = getDemoAppointments();
      return demoList.filter((a) => a.farmerId === farmerId || a.farmerId === 'DEMO-FARMER-01');
    }

    // 1. Try Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('storage_appointments')
          .select('*')
          .eq('farmer_id', farmerId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: StorageAppointmentRecord[] = data.map((d: any) => ({
            id: d.id,
            farmerId: d.farmer_id,
            farmerName: d.farmer_name,
            farmerPhone: d.farmer_phone,
            facilityId: d.facility_id,
            facilityName: d.facility_name,
            crop: d.crop,
            quantityQuintals: Number(d.quantity_quintals),
            preferredDate: d.preferred_date,
            preferredTime: d.preferred_time,
            confirmedDate: d.confirmed_date,
            confirmedTime: d.confirmed_time,
            proposedAlternativeDate: d.proposed_alternative_date,
            proposedAlternativeTime: d.proposed_alternative_time,
            rejectionReason: d.rejection_reason,
            additionalDetails: d.additional_details,
            status: d.status as StorageAppointmentStatus,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          this.mergeWithLocal(mapped);
        }
      } catch (err) {
        console.warn('Supabase fetch appointments error, using local registry:', err);
      }
    }

    // 2. Query local persistent storage
    const all = this.getAllLocal();
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : undefined;
    return all.filter(
      (a) => a.farmerId === farmerId || (cleanPhone && a.farmerPhone.replace(/\D/g, '').endsWith(cleanPhone))
    );
  },

  /**
   * Fetch appointment requests for a cold storage facility (Owner Portal)
   */
  async getAppointmentsByFacility(facilityId: string): Promise<StorageAppointmentRecord[]> {
    if (AuthService.isDemoSession()) {
      const demoList = getDemoAppointments();
      return demoList.filter((a) => a.facilityId === facilityId || facilityId === 'cs-001');
    }

    // 1. Try Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('storage_appointments')
          .select('*')
          .eq('facility_id', facilityId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: StorageAppointmentRecord[] = data.map((d: any) => ({
            id: d.id,
            farmerId: d.farmer_id,
            farmerName: d.farmer_name,
            farmerPhone: d.farmer_phone,
            facilityId: d.facility_id,
            facilityName: d.facility_name,
            crop: d.crop,
            quantityQuintals: Number(d.quantity_quintals),
            preferredDate: d.preferred_date,
            preferredTime: d.preferred_time,
            confirmedDate: d.confirmed_date,
            confirmedTime: d.confirmed_time,
            proposedAlternativeDate: d.proposed_alternative_date,
            proposedAlternativeTime: d.proposed_alternative_time,
            rejectionReason: d.rejection_reason,
            additionalDetails: d.additional_details,
            status: d.status as StorageAppointmentStatus,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          this.mergeWithLocal(mapped);
        }
      } catch (err) {
        console.warn('Supabase fetch facility appointments error:', err);
      }
    }

    const all = this.getAllLocal();
    return all.filter((a) => a.facilityId === facilityId);
  },

  /**
   * Farmer submits an appointment request
   */
  async createAppointment(
    data: Omit<StorageAppointmentRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<StorageAppointmentRecord> {
    const now = new Date().toISOString();
    const id = `app-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(-4)}`;

    const newRecord: StorageAppointmentRecord = {
      ...data,
      id,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    // Save locally
    const all = this.getAllLocal();
    const updated = [newRecord, ...all];
    this.saveLocal(updated);

    // Sync to Supabase in background
    if (isSupabaseConfigured && !AuthService.isDemoSession()) {
      try {
        await supabase.from('storage_appointments').insert({
          id: newRecord.id,
          farmer_id: newRecord.farmerId,
          farmer_name: newRecord.farmerName,
          farmer_phone: newRecord.farmerPhone,
          facility_id: newRecord.facilityId,
          facility_name: newRecord.facilityName,
          crop: newRecord.crop,
          quantity_quintals: newRecord.quantityQuintals,
          preferred_date: newRecord.preferredDate,
          preferred_time: newRecord.preferredTime,
          additional_details: newRecord.additionalDetails,
          status: 'Pending',
          created_at: now,
          updated_at: now,
        });
      } catch (e) {
        console.warn('Supabase insert note:', e);
      }
    }

    return newRecord;
  },

  /**
   * Owner approves an appointment
   */
  async approveAppointment(appointmentId: string): Promise<StorageAppointmentRecord> {
    const all = this.getAllLocal();
    const target = all.find((a) => a.id === appointmentId);
    if (!target) throw new Error('Appointment not found');

    const confirmedDate = target.proposedAlternativeDate || target.preferredDate;
    const confirmedTime = target.proposedAlternativeTime || target.preferredTime;
    const now = new Date().toISOString();

    const updatedRecord: StorageAppointmentRecord = {
      ...target,
      status: 'Approved',
      confirmedDate,
      confirmedTime,
      updatedAt: now,
    };

    const nextAll = all.map((a) => (a.id === appointmentId ? updatedRecord : a));
    this.saveLocal(nextAll);

    if (isSupabaseConfigured && !AuthService.isDemoSession()) {
      try {
        await supabase.from('storage_appointments').update({
          status: 'Approved',
          confirmed_date: confirmedDate,
          confirmed_time: confirmedTime,
          updated_at: now,
        }).eq('id', appointmentId);
      } catch (e) {
        console.warn('Supabase update note:', e);
      }
    }

    return updatedRecord;
  },

  /**
   * Owner rejects an appointment with reason
   */
  async rejectAppointment(appointmentId: string, rejectionReason: string): Promise<StorageAppointmentRecord> {
    const all = this.getAllLocal();
    const target = all.find((a) => a.id === appointmentId);
    if (!target) throw new Error('Appointment not found');

    const now = new Date().toISOString();
    const updatedRecord: StorageAppointmentRecord = {
      ...target,
      status: 'Rejected',
      rejectionReason: rejectionReason.trim(),
      updatedAt: now,
    };

    const nextAll = all.map((a) => (a.id === appointmentId ? updatedRecord : a));
    this.saveLocal(nextAll);

    if (isSupabaseConfigured && !AuthService.isDemoSession()) {
      try {
        await supabase.from('storage_appointments').update({
          status: 'Rejected',
          rejection_reason: rejectionReason.trim(),
          updated_at: now,
        }).eq('id', appointmentId);
      } catch (e) {
        console.warn('Supabase update note:', e);
      }
    }

    return updatedRecord;
  },

  /**
   * Owner suggests alternative date and time
   */
  async suggestAlternativeTime(
    appointmentId: string,
    proposedDate: string,
    proposedTime: string,
    note?: string
  ): Promise<StorageAppointmentRecord> {
    const all = this.getAllLocal();
    const target = all.find((a) => a.id === appointmentId);
    if (!target) throw new Error('Appointment not found');

    const now = new Date().toISOString();
    const updatedRecord: StorageAppointmentRecord = {
      ...target,
      status: 'Reschedule Requested',
      proposedAlternativeDate: proposedDate,
      proposedAlternativeTime: proposedTime,
      additionalDetails: note
        ? `${target.additionalDetails ? target.additionalDetails + ' | ' : ''}Owner Note: ${note}`
        : target.additionalDetails,
      updatedAt: now,
    };

    const nextAll = all.map((a) => (a.id === appointmentId ? updatedRecord : a));
    this.saveLocal(nextAll);

    if (isSupabaseConfigured && !AuthService.isDemoSession()) {
      try {
        await supabase.from('storage_appointments').update({
          status: 'Reschedule Requested',
          proposed_alternative_date: proposedDate,
          proposed_alternative_time: proposedTime,
          additional_details: updatedRecord.additionalDetails,
          updated_at: now,
        }).eq('id', appointmentId);
      } catch (e) {
        console.warn('Supabase update note:', e);
      }
    }

    return updatedRecord;
  },

  /**
   * Farmer accepts the owner's proposed alternative date/time
   */
  async farmerAcceptAlternative(appointmentId: string): Promise<StorageAppointmentRecord> {
    const all = this.getAllLocal();
    const target = all.find((a) => a.id === appointmentId);
    if (!target) throw new Error('Appointment not found');

    const now = new Date().toISOString();
    const confirmedDate = target.proposedAlternativeDate || target.preferredDate;
    const confirmedTime = target.proposedAlternativeTime || target.preferredTime;

    const updatedRecord: StorageAppointmentRecord = {
      ...target,
      status: 'Approved',
      confirmedDate,
      confirmedTime,
      updatedAt: now,
    };

    const nextAll = all.map((a) => (a.id === appointmentId ? updatedRecord : a));
    this.saveLocal(nextAll);

    if (isSupabaseConfigured && !AuthService.isDemoSession()) {
      try {
        await supabase.from('storage_appointments').update({
          status: 'Approved',
          confirmed_date: confirmedDate,
          confirmed_time: confirmedTime,
          updated_at: now,
        }).eq('id', appointmentId);
      } catch (e) {
        console.warn('Supabase update note:', e);
      }
    }

    return updatedRecord;
  },

  /**
   * Farmer counter-proposes a different date/time back to the owner
   */
  async farmerCounterPropose(
    appointmentId: string,
    newPreferredDate: string,
    newPreferredTime: string,
    note?: string
  ): Promise<StorageAppointmentRecord> {
    const all = this.getAllLocal();
    const target = all.find((a) => a.id === appointmentId);
    if (!target) throw new Error('Appointment not found');

    const now = new Date().toISOString();
    const updatedRecord: StorageAppointmentRecord = {
      ...target,
      status: 'Reschedule Requested',
      preferredDate: newPreferredDate,
      preferredTime: newPreferredTime,
      proposedAlternativeDate: undefined,
      proposedAlternativeTime: undefined,
      additionalDetails: note
        ? `${target.additionalDetails ? target.additionalDetails + ' | ' : ''}Farmer Counter-proposal: ${note}`
        : target.additionalDetails,
      updatedAt: now,
    };

    const nextAll = all.map((a) => (a.id === appointmentId ? updatedRecord : a));
    this.saveLocal(nextAll);

    if (isSupabaseConfigured && !AuthService.isDemoSession()) {
      try {
        await supabase.from('storage_appointments').update({
          status: 'Reschedule Requested',
          preferred_date: newPreferredDate,
          preferred_time: newPreferredTime,
          proposed_alternative_date: null,
          proposed_alternative_time: null,
          additional_details: updatedRecord.additionalDetails,
          updated_at: now,
        }).eq('id', appointmentId);
      } catch (e) {
        console.warn('Supabase update note:', e);
      }
    }

    return updatedRecord;
  },

  /**
   * Helper to merge Supabase records into local storage without overwriting newer local edits
   */
  mergeWithLocal(remoteRecords: StorageAppointmentRecord[]) {
    const local = this.getAllLocal();
    const localMap = new Map(local.map((l) => [l.id, l]));

    for (const remote of remoteRecords) {
      const existing = localMap.get(remote.id);
      if (!existing || new Date(remote.updatedAt) > new Date(existing.updatedAt)) {
        localMap.set(remote.id, remote);
      }
    }

    this.saveLocal(Array.from(localMap.values()));
  },
};
