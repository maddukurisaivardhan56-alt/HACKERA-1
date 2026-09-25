import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FarmerProfile, BulkCallResultItem, BulkCallBatchRecord } from '../../types';
import { BulkCallingService } from '../../services/bulkCallingService';
import { OfficerProfileHeader } from '../../components/admin/OfficerProfileHeader';
import { Modal } from '../../components/common/Modal';
import {
  PhoneCall,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Sprout,
  ShieldCheck,
  RotateCcw,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
  Bot,
  Layers,
} from 'lucide-react';

const CALL_PURPOSES = [
  'Routine Cultivation & Crop Health Check',
  'APMC Mandi Modal Price Spike Advisory',
  'Cold Storage Preservation & Booking Notice',
  'Pest Attack & Weather Stress Early Warning',
];

export const BulkCallingPage: React.FC = () => {
  const { officer, session } = useApp();

  // Data states
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [telephonyStatus, setTelephonyStatus] = useState<{
    twilioConfigured: boolean;
    twilioPhoneNumber: string | null;
    note?: string;
  }>({
    twilioConfigured: false,
    twilioPhoneNumber: null,
  });

  // Selection state
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<Set<string>>(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [cropFilter, setCropFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [eligibleOnlyFilter, setEligibleOnlyFilter] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'selection' | 'history'>('selection');

  // Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [callPurpose, setCallPurpose] = useState<string>(CALL_PURPOSES[0]);
  const [isCallingInProgress, setIsCallingInProgress] = useState<boolean>(false);

  // Results & Progress Modal state
  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false);
  const [batchExecutionResults, setBatchExecutionResults] = useState<{
    batchId?: string;
    totalSelected: number;
    totalEligible: number;
    queuedCount: number;
    completedCount: number;
    failedCount: number;
    skippedCount: number;
    results: BulkCallResultItem[];
  } | null>(null);

  // Call History states
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyBatches, setHistoryBatches] = useState<BulkCallBatchRecord[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('All');

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [farmersData, statusData] = await Promise.all([
          BulkCallingService.getRegisteredFarmers(),
          BulkCallingService.getTelephonyStatus(),
        ]);
        if (isMounted) {
          setFarmers(farmersData);
          setTelephonyStatus(statusData);
        }
      } catch (err) {
        console.error('Error loading bulk calling data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh history when tab opened
  useEffect(() => {
    if (activeTab === 'history') {
      BulkCallingService.getCallHistory().then(({ logs, batches }) => {
        setHistoryLogs(logs);
        setHistoryBatches(batches);
      });
    }
  }, [activeTab]);

  // Eligibility helper
  const checkFarmerEligibility = (farmer: FarmerProfile) => {
    const isStatusActive = farmer.status === 'Active' || farmer.status === 'Pending Verification' || !farmer.status;
    const hasConsent = farmer.consentForAdvisory === true;
    const cleanDigits = String(farmer.phone || '').replace(/\D/g, '').slice(-10);
    const hasValidPhone = cleanDigits.length === 10 && /^[6-9]\d{9}$/.test(cleanDigits);

    const isEligible = isStatusActive && hasConsent && hasValidPhone;

    let reason = '';
    if (!isStatusActive) {
      reason = `Account status is '${farmer.status}' (Suspended/Inactive)`;
    } else if (!hasConsent) {
      reason = 'Advisory consent not granted';
    } else if (!hasValidPhone) {
      reason = 'Invalid 10-digit Indian phone number';
    }

    return { isEligible, reason, cleanPhone: cleanDigits };
  };

  // Distinct districts and crops for filters
  const distinctDistricts = useMemo(() => {
    const set = new Set<string>();
    farmers.forEach((f) => {
      if (f.district) set.add(f.district);
    });
    return Array.from(set).sort();
  }, [farmers]);

  const distinctCrops = useMemo(() => {
    const set = new Set<string>();
    farmers.forEach((f) => {
      if (f.primaryCrop) set.add(f.primaryCrop);
    });
    return Array.from(set).sort();
  }, [farmers]);

  // Filtered farmers list
  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = farmer.name.toLowerCase().includes(q);
        const matchesId = farmer.id.toLowerCase().includes(q);
        const matchesPhone = farmer.phone.includes(q);
        const matchesVillage = (farmer.village || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesVillage) {
          return false;
        }
      }

      // District
      if (districtFilter !== 'All' && farmer.district !== districtFilter) {
        return false;
      }

      // Crop
      if (cropFilter !== 'All' && farmer.primaryCrop !== cropFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'All' && (farmer.status || 'Active') !== statusFilter) {
        return false;
      }

      // Eligible Only
      if (eligibleOnlyFilter) {
        const { isEligible } = checkFarmerEligibility(farmer);
        if (!isEligible) return false;
      }

      return true;
    });
  }, [farmers, searchQuery, districtFilter, cropFilter, statusFilter, eligibleOnlyFilter]);

  // Eligible count in filtered list
  const eligibleFarmersInView = useMemo(() => {
    return filteredFarmers.filter((f) => checkFarmerEligibility(f).isEligible);
  }, [filteredFarmers]);

  // Selected eligible farmers
  const selectedEligibleFarmers = useMemo(() => {
    return farmers.filter(
      (f) => selectedFarmerIds.has(f.id) && checkFarmerEligibility(f).isEligible
    );
  }, [farmers, selectedFarmerIds]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const total = farmers.length;
    const eligible = farmers.filter((f) => checkFarmerEligibility(f).isEligible).length;
    const selected = selectedFarmerIds.size;
    const selectedEligible = selectedEligibleFarmers.length;
    const ineligible = total - eligible;
    return { total, eligible, selected, selectedEligible, ineligible };
  }, [farmers, selectedFarmerIds, selectedEligibleFarmers]);

  // Selection handlers
  const handleToggleFarmer = (farmer: FarmerProfile) => {
    const { isEligible } = checkFarmerEligibility(farmer);
    if (!isEligible) return; // Prevent selection of ineligible farmers

    setSelectedFarmerIds((prev) => {
      const next = new Set(prev);
      if (next.has(farmer.id)) {
        next.delete(farmer.id);
      } else {
        next.add(farmer.id);
      }
      return next;
    });
  };

  const handleSelectAllEligible = () => {
    setSelectedFarmerIds((prev) => {
      const next = new Set(prev);
      eligibleFarmersInView.forEach((f) => next.add(f.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedFarmerIds(new Set());
  };

  // Trigger Bulk Make Calls
  const handleConfirmMakeCalls = async () => {
    if (selectedEligibleFarmers.length === 0 || isCallingInProgress) return;

    setIsCallingInProgress(true);
    try {
      const payload = {
        farmerIds: selectedEligibleFarmers.map((f) => f.id),
        callPurpose,
        adminEmail: session.adminEmail || officer.email || 'admin@hackara.in',
      };

      const res = await BulkCallingService.initiateBulkCalls(payload);

      setBatchExecutionResults({
        batchId: res.batchId,
        totalSelected: res.totalSelected || payload.farmerIds.length,
        totalEligible: res.totalEligible || payload.farmerIds.length,
        queuedCount: res.queuedCount || 0,
        completedCount: res.completedCount || 0,
        failedCount: res.failedCount || 0,
        skippedCount: res.skippedCount || 0,
        results: res.results || [],
      });

      // Clear selection upon successful queuing
      if (res.success && (res.queuedCount || 0) > 0) {
        setSelectedFarmerIds(new Set());
      }

      setIsConfirmModalOpen(false);
      setIsResultsModalOpen(true);
    } catch (err) {
      console.error('Failed to trigger bulk calls:', err);
    } finally {
      setIsCallingInProgress(false);
    }
  };

  // Filtered history logs
  const filteredHistoryLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchesFarmer = (log.farmer_id || '').toLowerCase().includes(q);
        const matchesSid = (log.call_sid || '').toLowerCase().includes(q);
        const matchesSummary = (log.summary || '').toLowerCase().includes(q);
        if (!matchesFarmer && !matchesSid && !matchesSummary) return false;
      }
      if (historyStatusFilter !== 'All' && log.status !== historyStatusFilter) {
        return false;
      }
      return true;
    });
  }, [historyLogs, historySearchQuery, historyStatusFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Profile */}
      <OfficerProfileHeader />

      {/* 2. Telephony & AI Voice Gateway Architecture Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold border border-emerald-600">
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bulk AI Outbound Calling Subsystem</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Admin Bulk AI Calling Dispatcher</span>
            </h1>
            <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
              Initiate rate-limited, carrier-verified voice outreach to eligible smallholders with automated TwiML speech prompts in Marathi, Hindi, and Telugu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'selection' ? 'history' : 'selection')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all"
            >
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>{activeTab === 'selection' ? 'View Call History' : 'Back to Farmer Selection'}</span>
            </button>
          </div>
        </div>

        {/* Telephony Connection & AI Voice Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-800/60 text-xs">
          {/* Card 1: Twilio Telephony */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                telephonyStatus.twilioConfigured
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold block text-white text-[11px]">
                Twilio Voice Gateway
              </span>
              <span
                className={`inline-flex items-center gap-1 font-mono text-[10px] ${
                  telephonyStatus.twilioConfigured ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {telephonyStatus.twilioConfigured ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Configured ({telephonyStatus.twilioPhoneNumber || 'Active'})</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>Credentials Pending in Secrets</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Card 2: Edge Function */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold block text-white text-[11px]">
                Supabase Edge Runtime
              </span>
              <span className="text-[10px] text-blue-200 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                <span>bulk-make-calls (Rate limit: 750ms)</span>
              </span>
            </div>
          </div>

          {/* Card 3: AI Voice Agent */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold block text-white text-[11px]">
                Conversational AI Layer
              </span>
              <span className="text-[10px] text-purple-200 block line-clamp-1">
                Awaiting AI Agent WebSocket integration
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E0C79B] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('selection')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'selection'
              ? 'bg-[#064E3B] text-white shadow-sm'
              : 'bg-[#FFFDF7] text-gray-700 hover:bg-[#F8E7C9] border border-[#E0C79B]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Select Farmers & Make Calls</span>
          {kpis.selected > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-bold text-[10px]">
              {kpis.selected}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-[#064E3B] text-white shadow-sm'
              : 'bg-[#FFFDF7] text-gray-700 hover:bg-[#F8E7C9] border border-[#E0C79B]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Call History & Audit Logs</span>
          {historyLogs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-800 font-bold text-[10px]">
              {historyLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: FARMER SELECTION & CALL DISPATCH */}
      {activeTab === 'selection' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#FFFDF7] border border-[#E0C79B] rounded-xl shadow-xs">
              <span className="text-xs text-gray-500 block font-medium">Total Farmers</span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">{kpis.total}</span>
              <span className="text-[11px] text-gray-500">In registered database</span>
            </div>

            <div className="p-3.5 bg-[#FFFDF7] border border-[#E0C79B] rounded-xl shadow-xs">
              <span className="text-xs text-gray-500 block font-medium">Eligible for Calling</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">{kpis.eligible}</span>
              <span className="text-[11px] text-emerald-600 font-medium">Active & consented</span>
            </div>

            <div className="p-3.5 bg-[#FFFDF7] border border-[#E0C79B] rounded-xl shadow-xs">
              <span className="text-xs text-gray-500 block font-medium">Selected Farmers</span>
              <span className="text-2xl font-bold text-blue-700 mt-1 block">{kpis.selected}</span>
              <span className="text-[11px] text-blue-600 font-medium">
                {kpis.selectedEligible} eligible for batch
              </span>
            </div>

            <div className="p-3.5 bg-[#FFFDF7] border border-[#E0C79B] rounded-xl shadow-xs">
              <span className="text-xs text-gray-500 block font-medium">Ineligible Farmers</span>
              <span className="text-2xl font-bold text-amber-700 mt-1 block">{kpis.ineligible}</span>
              <span className="text-[11px] text-amber-600 font-medium">Verification pending</span>
            </div>
          </div>

          {/* Search, Filter, and Selection Bar */}
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by farmer name, ID, phone, or village..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* District filter */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-gray-700 focus:outline-none font-medium"
                  >
                    <option value="All">All Districts</option>
                    {distinctDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Crop filter */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <select
                    value={cropFilter}
                    onChange={(e) => setCropFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-gray-700 focus:outline-none font-medium"
                  >
                    <option value="All">All Crops</option>
                    {distinctCrops.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-gray-700 focus:outline-none font-medium"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Eligible Only Toggle */}
                <button
                  type="button"
                  onClick={() => setEligibleOnlyFilter(!eligibleOnlyFilter)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    eligibleOnlyFilter
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Eligible Only</span>
                </button>

                {/* Reset */}
                {(searchQuery || districtFilter !== 'All' || cropFilter !== 'All' || statusFilter !== 'All' || eligibleOnlyFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDistrictFilter('All');
                      setCropFilter('All');
                      setStatusFilter('All');
                      setEligibleOnlyFilter(false);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 underline px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Selection Quick Actions & Prominent Make Calls Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllEligible}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 text-xs font-semibold transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Select All Eligible ({eligibleFarmersInView.length})</span>
                </button>

                {selectedFarmerIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 text-gray-500" />
                    <span>Clear Selection</span>
                  </button>
                )}

                <span className="text-xs font-medium text-gray-600 ml-1">
                  Selected: <strong className="text-emerald-800">{kpis.selectedEligible}</strong> eligible farmer{kpis.selectedEligible === 1 ? '' : 's'}
                </span>
              </div>

              {/* PROMINENT MAKE CALLS BUTTON */}
              <button
                type="button"
                disabled={kpis.selectedEligible === 0}
                onClick={() => setIsConfirmModalOpen(true)}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  kpis.selectedEligible > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white cursor-pointer active:scale-98 ring-2 ring-emerald-500/50'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none'
                }`}
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>
                  Make Calls ({kpis.selectedEligible} Eligible)
                </span>
              </button>
            </div>
          </div>

          {/* Farmers Table / Card Layout */}
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading registered farmers database...</span>
              </div>
            ) : filteredFarmers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">No registered farmers match your filters.</p>
                <p className="text-xs text-gray-500">Try adjusting your search query or reset filter dropdowns.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-[#F8E7C9]/60 text-[#064E3B] font-bold border-b border-[#E0C79B] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">Select</th>
                      <th className="py-3 px-3">Farmer & ID</th>
                      <th className="py-3 px-3">Phone Number</th>
                      <th className="py-3 px-3">District & Taluka</th>
                      <th className="py-3 px-3">Primary Crop</th>
                      <th className="py-3 px-3">Account Status</th>
                      <th className="py-3 px-3">Advisory Consent</th>
                      <th className="py-3 px-3 text-right">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFarmers.map((farmer) => {
                      const { isEligible, reason } = checkFarmerEligibility(farmer);
                      const isSelected = selectedFarmerIds.has(farmer.id);

                      return (
                        <tr
                          key={farmer.id}
                          onClick={() => isEligible && handleToggleFarmer(farmer)}
                          className={`transition-colors ${
                            isEligible
                              ? 'cursor-pointer hover:bg-emerald-50/40'
                              : 'bg-gray-50/70 text-gray-400 cursor-not-allowed'
                          } ${isSelected ? 'bg-emerald-50/70 font-medium' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={!isEligible}
                              checked={isSelected}
                              onChange={() => handleToggleFarmer(farmer)}
                              className={`w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 ${
                                !isEligible ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            />
                          </td>

                          {/* Farmer Name & ID */}
                          <td className="py-3 px-3">
                            <div className={`font-bold ${isEligible ? 'text-gray-900' : 'text-gray-500'}`}>
                              {farmer.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                              <span className="font-mono bg-gray-100 px-1 py-0.2 rounded text-[10px] text-gray-600">
                                {farmer.id}
                              </span>
                              <span>•</span>
                              <span className="uppercase text-[10px] bg-emerald-50 text-emerald-800 px-1 rounded font-semibold">
                                {farmer.preferredLanguage || 'mr'}
                              </span>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {farmer.phone ? (
                              <div className="flex items-center gap-1 text-gray-700">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>+91 {farmer.phone.slice(-10)}</span>
                              </div>
                            ) : (
                              <span className="text-red-400 italic">No phone registered</span>
                            )}
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-800">{farmer.district}</div>
                            <div className="text-[11px] text-gray-500">
                              Tal. {farmer.taluka || 'N/A'}{farmer.village ? `, ${farmer.village}` : ''}
                            </div>
                          </td>

                          {/* Crop */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-emerald-950 flex items-center gap-1">
                              <Sprout className="w-3 h-3 text-emerald-600" />
                              <span>{farmer.primaryCrop || 'Onion'}</span>
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {farmer.landAreaAcres || 0} Acres
                            </div>
                          </td>

                          {/* Account Status Badge */}
                          <td className="py-3 px-3">
                            {farmer.status === 'Active' || farmer.status === 'Pending Verification' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300">
                                <XCircle className="w-3 h-3 text-red-600" />
                                {farmer.status || 'Inactive'}
                              </span>
                            )}
                          </td>

                          {/* Advisory Consent Badge */}
                          <td className="py-3 px-3">
                            {farmer.consentForAdvisory === true ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Granted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                                <XCircle className="w-3 h-3 text-gray-400" />
                                Revoked
                              </span>
                            )}
                          </td>

                          {/* Eligibility Status & Instant Call Button */}
                          <td className="py-3 px-3 text-right">
                            {isEligible ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Eligible
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFarmerIds(new Set([farmer.id]));
                                    setIsConfirmModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                                  title="Trigger immediate outbound call to this farmer"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Call Now</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200" title={reason}>
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Ineligible
                                </span>
                                <span className="block text-[10px] text-gray-400 max-w-[140px] truncate ml-auto mt-0.5" title={reason}>
                                  {reason}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CALL HISTORY & AUDIT LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search call logs by farmer ID, call SID, summary..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Calling">Calling / Queued</option>
                  <option value="Connected">Connected</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    BulkCallingService.getCallHistory().then(({ logs, batches }) => {
                      setHistoryLogs(logs);
                      setHistoryBatches(batches);
                    });
                  }}
                  className="p-2 text-gray-600 hover:text-emerald-700 bg-white border border-gray-300 rounded-xl"
                  title="Refresh logs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Batches Cards */}
          {historyBatches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Recent Bulk Calling Batches</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {historyBatches.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-3 bg-[#FFFDF7] border border-[#E0C79B] rounded-xl text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded text-gray-700">{b.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : b.status === 'Partial Failure' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 truncate">{b.callPurpose}</div>
                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Queued: <strong className="text-blue-700">{b.queuedCount}</strong></span>
                      <span>Completed: <strong className="text-emerald-700">{b.completedCount}</strong></span>
                      <span>Failed: <strong className="text-red-700">{b.failedCount}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Table */}
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-xs overflow-hidden">
            {filteredHistoryLogs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">No call logs found.</p>
                <p className="text-xs text-gray-500">Initiate bulk AI calls to view carrier history and audit records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-[#F8E7C9]/60 text-[#064E3B] font-bold border-b border-[#E0C79B] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Farmer ID</th>
                      <th className="py-3 px-3">Twilio Call SID</th>
                      <th className="py-3 px-3">Purpose</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Duration</th>
                      <th className="py-3 px-3">Summary / Carrier Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistoryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : log.timestamp || 'N/A'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900 font-mono">
                          {log.farmer_id}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                          {log.call_sid ? (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700">
                              {log.call_sid}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-800 font-medium">
                          {log.call_purpose || log.stage || 'Routine AI Advisory'}
                        </td>
                        <td className="py-3 px-3">
                          {log.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Completed
                            </span>
                          ) : log.status === 'Calling' || log.status === 'Connected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                              <Phone className="w-3 h-3 text-blue-600 animate-pulse" />
                              {log.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-300">
                              <XCircle className="w-3 h-3 text-red-600" />
                              {log.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-mono">
                          {log.duration_seconds ? `${log.duration_seconds}s` : '0s'}
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-[11px] max-w-xs truncate" title={log.summary || log.failure_reason}>
                          {log.failure_reason ? (
                            <span className="text-red-700 font-medium">{log.failure_reason}</span>
                          ) : (
                            log.summary || 'Outbound call record'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isCallingInProgress && setIsConfirmModalOpen(false)}
        title="Confirm Outbound Bulk AI Calling"
        subtitle={`Review selected farmers and carrier dispatch settings`}
        maxWidth="xl"
      >
        <div className="space-y-4 p-4 text-xs">
          {/* Call Purpose Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 block">
              1. Select Advisory Call Purpose:
            </label>
            <select
              value={callPurpose}
              onChange={(e) => setCallPurpose(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CALL_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Farmers Breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900">
                2. Target Farmers ({selectedEligibleFarmers.length}):
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">
                All {selectedEligibleFarmers.length} verified Active with consent
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50 p-1">
              {selectedEligibleFarmers.map((f) => (
                <div key={f.id} className="p-2 flex items-center justify-between text-xs bg-white rounded-lg my-0.5 shadow-2xs">
                  <div>
                    <span className="font-bold text-gray-900">{f.name}</span>
                    <span className="text-[11px] text-gray-500 ml-2 font-mono">({f.id})</span>
                    <div className="text-[11px] text-gray-500">
                      {f.district} • {f.primaryCrop} • Lang: <strong className="uppercase">{f.preferredLanguage || 'mr'}</strong>
                    </div>
                  </div>
                  <div className="text-right font-mono text-gray-700 font-medium">
                    +91 {f.phone.slice(-10)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Twilio Carrier & Trial Account Warning Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Carrier Telephony & Twilio Trial Notice</span>
            </div>
            <ul className="text-[11px] text-amber-900/90 list-disc list-inside space-y-1">
              <li>
                <strong>Real Phone Calling:</strong> Confirming will initiate real outbound PSTN calls to the farmers' mobile handsets via Twilio.
              </li>
              <li>
                <strong>Twilio Trial Restrictions:</strong> If your Twilio account is in trial mode, carrier calls can <em>only</em> connect to verified Caller IDs configured in your Twilio Console. Calls to unverified numbers will return code 21216.
              </li>
              <li>
                <strong>Rate-Limited Queue:</strong> Calls are dispatched sequentially with 750ms spacing to respect carrier concurrency limits.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              disabled={isCallingInProgress}
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isCallingInProgress}
              onClick={handleConfirmMakeCalls}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-sm active:scale-98"
            >
              {isCallingInProgress ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Dispatching Queue...</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" />
                  <span>Confirm & Start Calls ({selectedEligibleFarmers.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 5. EXECUTION RESULTS & PROGRESS MODAL */}
      <Modal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        title="Bulk AI Calling Dispatch Summary"
        subtitle={`Batch ID: ${batchExecutionResults?.batchId || 'N/A'}`}
        maxWidth="xl"
      >
        {batchExecutionResults && (
          <div className="space-y-4 p-4 text-xs">
            {/* KPI Badges */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-gray-100 border border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Selected</span>
                <span className="text-lg font-bold text-gray-900">{batchExecutionResults.totalSelected}</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">Queued</span>
                <span className="text-lg font-bold text-blue-800">{batchExecutionResults.queuedCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[10px] text-red-700 uppercase font-bold block">Failed</span>
                <span className="text-lg font-bold text-red-800">{batchExecutionResults.failedCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Skipped</span>
                <span className="text-lg font-bold text-amber-800">{batchExecutionResults.skippedCount}</span>
              </div>
            </div>

            {/* Per-Farmer Outcome List */}
            <div className="space-y-1.5">
              <span className="font-bold text-gray-900 block">Per-Farmer Execution Results:</span>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50 p-1">
                {batchExecutionResults.results.map((res, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg my-1 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{res.farmerName}</span>
                        <span className="font-mono text-[10px] text-gray-500">({res.farmerId})</span>
                      </div>
                      <div>
                        {res.status === 'queued' || res.status === 'calling' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <Phone className="w-3 h-3 text-blue-600 animate-pulse" />
                            Queued
                          </span>
                        ) : res.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Completed
                          </span>
                        ) : res.status === 'skipped' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-600 flex items-center justify-between">
                      <span>Handset: {res.phone}</span>
                      {res.callSid && (
                        <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1 rounded">
                          SID: {res.callSid}
                        </span>
                      )}
                    </div>

                    {res.reason && (
                      <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
                        {res.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Note on Status Updates */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
              <strong className="block text-blue-950">Asynchronous Status Tracking:</strong>
              <p>
                Twilio Call status updates (ringing, answered, duration, completed) are sent asynchronously via status callbacks. View real-time carrier progress in the Call History tab.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsResultsModalOpen(false);
                  setActiveTab('history');
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
              >
                Go to Call History
              </button>
              <button
                type="button"
                onClick={() => setIsResultsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
