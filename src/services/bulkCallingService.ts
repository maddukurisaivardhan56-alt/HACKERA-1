import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  FarmerProfile,
  BulkMakeCallsPayload,
  BulkMakeCallsResponse,
  BulkCallBatchRecord,
  TelephonyStatusResponse,
} from '../types';
import { MockStore } from '../data/mockStore';
import { INITIAL_FARMERS } from '../data/initialFarmers';
import { AuthService } from './authService';
import {
  SAFE_DEMO_FARMERS,
  SAFE_DEMO_CALL_BATCHES,
  SAFE_DEMO_CALL_LOGS,
} from '../data/demoData';

const DEMO_BATCHES_KEY = 'fg_demo_call_batches_v1';
const DEMO_LOGS_KEY = 'fg_demo_call_logs_v1';

function getDemoBatches(): BulkCallBatchRecord[] {
  try {
    const stored = sessionStorage.getItem(DEMO_BATCHES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return SAFE_DEMO_CALL_BATCHES;
}

function saveDemoBatches(batches: BulkCallBatchRecord[]) {
  try {
    sessionStorage.setItem(DEMO_BATCHES_KEY, JSON.stringify(batches));
  } catch {}
}

function getDemoLogs(): any[] {
  try {
    const stored = sessionStorage.getItem(DEMO_LOGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return SAFE_DEMO_CALL_LOGS;
}

function saveDemoLogs(logs: any[]) {
  try {
    sessionStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

export const BulkCallingService = {
  /**
   * Check telephony gateway and Twilio credentials status
   */
  async getTelephonyStatus(): Promise<TelephonyStatusResponse> {
    if (AuthService.isDemoSession()) {
      return {
        success: true,
        twilioConfigured: true,
        twilioPhoneNumber: '+91 98000 DEMO',
        maxBatchSize: 50,
        cooldownMinutes: 15,
        rateLimitDelayMs: 750,
        note: 'DEMO MODE: Carrier telephony simulated safely. No real calls are made.',
      };
    }

    try {
      const res = await fetch('/api/telephony/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch telephony status from dev server:', e);
    }
    return {
      success: true,
      twilioConfigured: false,
      twilioPhoneNumber: null,
      maxBatchSize: 50,
      cooldownMinutes: 15,
      rateLimitDelayMs: 750,
      note: 'Configurable via Supabase Edge Function secrets or .env.',
    };
  },

  /**
   * Fetch registered farmers for calling.
   * Merges dev server /api/telephony/farmers, Supabase public.farmers,
   * and the complete verified INITIAL_FARMERS list.
   */
  async getRegisteredFarmers(): Promise<FarmerProfile[]> {
    if (AuthService.isDemoSession()) {
      return SAFE_DEMO_FARMERS;
    }

    const farmerMap = new Map<string, FarmerProfile>();

    // 1. Seed with all verified demo farmers (Telugu team + Maharashtra)
    INITIAL_FARMERS.forEach((f) => {
      farmerMap.set(f.id, { ...f, status: 'Active', consentForAdvisory: true });
    });

    // 2. Try fetching from dev server /api/telephony/farmers
    try {
      const res = await fetch('/api/telephony/farmers');
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.farmers)) {
          body.farmers.forEach((f: any) => {
            const existing = farmerMap.get(f.id);
            if (existing) {
              farmerMap.set(f.id, { ...existing, ...f, status: 'Active', consentForAdvisory: true });
            } else {
              farmerMap.set(f.id, {
                id: f.id,
                name: f.name,
                phone: f.phone,
                state: f.state || 'Andhra Pradesh',
                district: f.district || 'Krishna',
                taluka: f.taluka || '',
                village: f.village || '',
                primaryCrop: f.primaryCrop || f.primary_crop || 'Onion',
                landAreaAcres: Number(f.landAreaAcres || f.land_area_acres) || 100,
                expectedHarvestQuintals: Number(f.expectedHarvestQuintals || f.expected_harvest_quintals) || 0,
                preferredLanguage: f.preferredLanguage || f.preferred_language || 'te',
                consentForAdvisory: true,
                registeredDate: f.registeredDate || f.registration_date || '2026-09-21',
                status: 'Active',
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Dev server farmers fetch not available:', e);
    }

    // 3. Try fetching from Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('farmers')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          data.forEach((d: any) => {
            const id = d.farmer_id || d.id;
            const existing = farmerMap.get(id);
            if (existing) {
              farmerMap.set(id, {
                ...existing,
                name: d.name || existing.name,
                phone: d.phone || existing.phone,
                district: d.district || existing.district,
                status: 'Active',
                consentForAdvisory: true,
              });
            } else {
              farmerMap.set(id, {
                id,
                name: d.name,
                phone: d.phone,
                state: d.state || 'Andhra Pradesh',
                district: d.district || 'Krishna',
                taluka: d.taluka || '',
                village: d.village || '',
                primaryCrop: d.primary_crop || 'Onion',
                landAreaAcres: Number(d.land_area_acres) || 100,
                expectedHarvestQuintals: Number(d.expected_harvest_quintals) || 0,
                preferredLanguage: d.preferred_language || 'te',
                consentForAdvisory: true,
                registeredDate: d.registration_date || d.created_at || '2026-09-21',
                status: 'Active',
                assignedOfficerId: d.assigned_officer_id,
              });
            }
          });
        }
      } catch (err) {
        console.warn('Supabase farmers fetch error, using merged seed store:', err);
      }
    }

    // 4. Also check MockStore
    const local = MockStore.getFarmers();
    if (local && local.length > 0) {
      local.forEach((f) => {
        if (!farmerMap.has(f.id)) {
          farmerMap.set(f.id, { ...f, status: 'Active', consentForAdvisory: true });
        }
      });
    }

    return Array.from(farmerMap.values());
  },

  /**
   * Dispatch Bulk Make Calls request.
   * Invokes Edge Function 'bulk-make-calls' using Supabase client,
   * with seamless fallback to dev server endpoint /api/telephony/bulk-make-calls.
   */
  async initiateBulkCalls(payload: BulkMakeCallsPayload): Promise<BulkMakeCallsResponse> {
    // Demo Mode Protection: NEVER trigger real Twilio calls in Demo Mode
    if (AuthService.isDemoSession()) {
      const batchId = `demo-batch-${Date.now().toString(36)}`;
      const now = new Date();

      const demoResults = payload.farmerIds.map((id, index) => {
        const f = SAFE_DEMO_FARMERS.find((x) => x.id === id);
        return {
          farmerId: id,
          farmerName: f?.name || `Demo Farmer ${index + 1}`,
          phone: f?.phone ? `+91 ******${f.phone.slice(-4)}` : '+91 ******2345',
          status: 'queued' as const,
          callSid: `DEMO-CALL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          message: 'Demo call queued',
        };
      });

      const newBatch: BulkCallBatchRecord = {
        id: batchId,
        adminId: payload.adminEmail || 'demo.admin@hackara.in',
        callPurpose: payload.callPurpose || 'Routine AI Advisory',
        totalSelected: payload.farmerIds.length,
        totalEligible: payload.farmerIds.length,
        queuedCount: payload.farmerIds.length,
        completedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        status: 'In Progress',
        results: demoResults,
        createdAt: now.toISOString(),
      };

      const existingBatches = getDemoBatches();
      saveDemoBatches([newBatch, ...existingBatches]);

      const newLogs = demoResults.map((r, i) => ({
        id: `demo-log-${Date.now()}-${i}`,
        farmer_id: r.farmerId,
        call_sid: r.callSid,
        stage: '3. Farmer & Crop Interaction',
        status: 'Queued',
        summary: `Demo call queued - Simulated carrier call for demonstration (${payload.callPurpose || 'Routine AI Advisory'})`,
        duration_seconds: 0,
        created_at: now.toISOString(),
      }));

      const existingLogs = getDemoLogs();
      saveDemoLogs([...newLogs, ...existingLogs]);

      return {
        success: true,
        batchId,
        totalSelected: payload.farmerIds.length,
        totalEligible: payload.farmerIds.length,
        queuedCount: payload.farmerIds.length,
        completedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        results: demoResults,
        message: 'Demo call queued successfully. Simulated carrier call for demonstration.',
      };
    }

    try {
      const res = await fetch('/api/telephony/bulk-make-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        return data as BulkMakeCallsResponse;
      }
      return {
        success: false,
        error: data?.error || 'SERVER_ERROR',
        message: data?.message || 'Failed to dispatch bulk calling request.',
        results: data?.results || [],
      };
    } catch (netErr: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: netErr?.message || 'Failed to connect to telephony service.',
      };
    }
  },

  /**
   * Fetch call history audit logs and batch summaries
   */
  async getCallHistory(): Promise<{ logs: any[]; batches: BulkCallBatchRecord[] }> {
    if (AuthService.isDemoSession()) {
      return {
        logs: getDemoLogs(),
        batches: getDemoBatches(),
      };
    }

    // 1. Try Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: logs } = await supabase
          .from('farmer_call_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: batches } = await supabase
          .from('bulk_call_batches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (logs || batches) {
          return {
            logs: logs || [],
            batches: (batches || []).map((b: any) => ({
              id: b.id,
              adminId: b.admin_id,
              callPurpose: b.call_purpose,
              totalSelected: b.total_selected,
              totalEligible: b.total_eligible,
              queuedCount: b.queued_count,
              completedCount: b.completed_count,
              failedCount: b.failed_count,
              skippedCount: b.skipped_count,
              status: b.status,
              results: b.results,
              createdAt: b.created_at,
            })),
          };
        }
      } catch (e) {
        console.warn('Supabase call history query failed:', e);
      }
    }

    // 2. Try dev server
    try {
      const res = await fetch('/api/telephony/call-history');
      if (res.ok) {
        const data = await res.json();
        return {
          logs: data.logs || [],
          batches: (data.batches || []).map((b: any) => ({
            id: b.id,
            adminId: b.admin_id,
            callPurpose: b.call_purpose,
            totalSelected: b.total_selected,
            totalEligible: b.total_eligible,
            queuedCount: b.queued_count,
            completedCount: b.completed_count,
            failedCount: b.failed_count,
            skippedCount: b.skipped_count,
            status: b.status,
            results: b.results,
            createdAt: b.created_at,
          })),
        };
      }
    } catch {}

    return { logs: [], batches: [] };
  },
};
