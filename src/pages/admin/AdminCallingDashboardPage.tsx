import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AICallingJourneyStage,
  IndividualCallStatus,
  FarmerCallingRecord,
} from '../../types';
import { STAGES_ORDER } from '../../services/callingJourneyService';
import { OfficerProfileHeader } from '../../components/admin/OfficerProfileHeader';
import { FarmerCallDetailModal } from '../../components/admin/FarmerCallDetailModal';
import {
  PhoneCall,
  Phone,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Sprout,
  CloudSun,
  TrendingUp,
  Warehouse,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  Bot,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCallingDashboardPage: React.FC = () => {
  const {
    officer,
    callingRecords,
    triggerCallForFarmer,
    retryCallForFarmer,
    advanceFarmerStage,
    batchRunRoutineCalls,
  } = useApp();

  // Filters state
  const jurisdictionFilter = 'assigned';
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFarmerForModal, setActiveFarmerForModal] = useState<FarmerCallingRecord | null>(null);
  const [batchActionToast, setBatchActionToast] = useState<string | null>(null);

  // Stage Icons & Color Mapping
  const stageMeta: Record<
    AICallingJourneyStage,
    { icon: React.FC<{ className?: string }>; color: string; desc: string }
  > = {
    '1. Government Registration': {
      icon: UserCheck,
      color: 'from-blue-600 to-indigo-600',
      desc: 'Government registers farmer on official portal',
    },
    '2. Initial AI Call': {
      icon: Bot,
      color: 'from-purple-600 to-indigo-700',
      desc: 'AI automatically calls registered farmer for consent & onboard',
    },
    '3. Farmer & Crop Interaction': {
      icon: Sprout,
      color: 'from-emerald-600 to-teal-700',
      desc: 'AI interacts to understand crops & farming details',
    },
    '4. Weather Updates': {
      icon: CloudSun,
      color: 'from-sky-600 to-cyan-700',
      desc: 'AI calls farmer with relevant weather updates & alerts',
    },
    '5. Market Price Updates': {
      icon: TrendingUp,
      color: 'from-amber-600 to-orange-700',
      desc: 'AI calls farmer with crop-specific APMC price updates',
    },
    '6. Cold Storage Updates': {
      icon: Warehouse,
      color: 'from-emerald-700 to-green-800',
      desc: 'AI calls farmer with relevant cold-storage information',
    },
  };

  // Filtered records by jurisdiction, search, stage, and status
  const filteredRecords = useMemo(() => {
    return callingRecords.filter((record) => {
      // Jurisdiction filter: officer's assigned taluka/district vs all
      if (jurisdictionFilter === 'assigned') {
        const isTalukaMatch =
          record.taluka.toLowerCase() === officer.assignedTaluka.toLowerCase();
        const isDistrictMatch =
          record.district.toLowerCase() === officer.assignedDistrict.toLowerCase();
        if (!isTalukaMatch && !isDistrictMatch) return false;
      }

      // Stage filter
      if (selectedStageFilter !== 'All' && record.currentStage !== selectedStageFilter) {
        return false;
      }

      // Call status filter
      if (selectedStatusFilter !== 'All' && record.callStatus !== selectedStatusFilter) {
        return false;
      }

      // Search query filter (name, phone, village, crop, farmer ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = record.farmerName.toLowerCase().includes(q);
        const matchesId = record.farmerId.toLowerCase().includes(q);
        const matchesVillage = record.village.toLowerCase().includes(q);
        const matchesCrop = record.selectedCrop.toLowerCase().includes(q);
        const matchesPhone = record.phone.includes(q);
        if (!matchesName && !matchesId && !matchesVillage && !matchesCrop && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [callingRecords, jurisdictionFilter, selectedStageFilter, selectedStatusFilter, searchQuery, officer]);

  // Stage Counts within the active jurisdiction scope
  const stageCounts = useMemo(() => {
    const scopeRecords = callingRecords.filter((r) => {
      if (jurisdictionFilter === 'assigned') {
        return (
          r.taluka.toLowerCase() === officer.assignedTaluka.toLowerCase() ||
          r.district.toLowerCase() === officer.assignedDistrict.toLowerCase()
        );
      }
      return true;
    });

    const counts: Record<string, number> = {};
    STAGES_ORDER.forEach((stage) => {
      counts[stage] = scopeRecords.filter((r) => r.currentStage === stage).length;
    });
    return counts;
  }, [callingRecords, jurisdictionFilter, officer]);

  // High-level KPIs
  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    const completed = filteredRecords.filter((r) => r.callStatus === 'Completed').length;
    const scheduled = filteredRecords.filter((r) => r.callStatus === 'Scheduled' || r.callStatus === 'Calling').length;
    const retryNeeded = filteredRecords.filter((r) => r.callStatus === 'Failed' || r.callStatus === 'Retry Needed').length;
    return { total, completed, scheduled, retryNeeded };
  }, [filteredRecords]);

  // Run routine batch calls without manual routine work
  const handleBatchTrigger = (
    stage: '4. Weather Updates' | '5. Market Price Updates' | '6. Cold Storage Updates',
    title: string
  ) => {
    const res = batchRunRoutineCalls(stage);
    setBatchActionToast(`Automated routine calling broadcast dispatched: ${res.triggeredCount} farmers in ${title} updated successfully.`);
    setTimeout(() => setBatchActionToast(null), 5000);
  };

  const getStatusBadge = (status: IndividualCallStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'Calling':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Phone className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Calling
          </span>
        );
      case 'Connected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
            <PhoneCall className="w-3.5 h-3.5 text-green-600" />
            Connected
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Scheduled
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Failed
          </span>
        );
      case 'Retry Needed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
            Retry Needed
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Agriculture Officer Profile Header */}
      <OfficerProfileHeader />

      {/* Routine Calling Toast Notification */}
      {batchActionToast && (
        <div className="bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs animate-fadeIn border border-emerald-600">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>{batchActionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setBatchActionToast(null)}
            className="text-emerald-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. AI Calling Dashboard 6 Stages Visual Funnel */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              AI Farmer-Calling Journey
            </h2>
            <p className="text-xs text-gray-500">
              Click any stage card to filter farmers. Routine automated calls advance farmers through stages upon completion.
            </p>
          </div>

          {/* Broadcast Routine Updates Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/admin/bulk-calling"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 text-xs font-bold shadow-xs transition-all active:scale-98"
              title="Launch Bulk AI Calling Dispatcher with multi-select and Twilio carrier calling"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Bulk AI Calling</span>
            </Link>

            <span className="text-[11px] font-medium text-gray-500 hidden md:inline">
              Automated Routines:
            </span>
            <button
              type="button"
              onClick={() => handleBatchTrigger('4. Weather Updates', 'Weather Updates')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 text-xs font-medium transition-colors"
              title="Dispatches routine AI weather advisory calls"
            >
              <CloudSun className="w-3.5 h-3.5 text-sky-600" />
              <span>Weather Batch</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchTrigger('5. Market Price Updates', 'Market Price Updates')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-medium transition-colors"
              title="Dispatches routine crop modal price calls"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Market Price Batch</span>
            </button>
          </div>
        </div>

        {/* 6 Interactive Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES_ORDER.map((stage, idx) => {
            const meta = stageMeta[stage];
            const Icon = meta.icon;
            const count = stageCounts[stage] || 0;
            const isSelected = selectedStageFilter === stage;

            return (
              <button
                type="button"
                key={stage}
                onClick={() => setSelectedStageFilter(isSelected ? 'All' : stage)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-emerald-600 shadow-md bg-white border-emerald-500'
                    : 'bg-white hover:bg-gray-50/90 border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shadow-sm`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                      Step {idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug">
                      {stage.replace(/^\d+\.\s*/, '')}
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-normal">
                      {meta.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Farmers</span>
                  <span
                    className={`font-bold text-sm px-2 py-0.5 rounded-full ${
                      count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Summary KPIs & Farmer Support Cross-link Alert */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-xs text-gray-500 block font-medium">Total In Scope</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{kpis.total}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Active farmer calling records</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-xs text-gray-500 block font-medium">Calls Completed</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{kpis.completed}</span>
          <span className="text-[11px] text-gray-500">Delivered successfully</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-xs text-gray-500 block font-medium">Scheduled / In Call</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{kpis.scheduled}</span>
          <span className="text-[11px] text-gray-500">Active automated queue</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-xs text-gray-500 block font-medium">Retry Needed</span>
          <span className="text-2xl font-bold text-orange-700 mt-1 block">{kpis.retryNeeded}</span>
          <span className="text-[11px] text-orange-600 font-medium">Manual retry available</span>
        </div>
      </div>

      {/* Link to Farmer Support & Field Inspection Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-emerald-950">Integrated Agricultural Problem Handling:</strong>
            <p className="text-emerald-800 text-[11px]">
              If a farmer reports pest attacks or water stress during any AI call, open the farmer card to log an official complaint with scheduled visit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/farmer-support"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/70 font-semibold transition-colors"
          >
            <span>Go to Farmer Support</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to="/admin/field-inspections"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-semibold transition-colors"
          >
            <span>Field Inspections</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 3. Farmer Registry & Calling Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by farmer name, ID, phone, village, or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Stage filter dropdown */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-gray-700 focus:outline-none font-medium"
              >
                <option value="All">All 6 Stages</option>
                {STAGES_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter dropdown */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-gray-700 focus:outline-none font-medium"
              >
                <option value="All">All Call Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Calling">Calling</option>
                <option value="Connected">Connected</option>
                <option value="Failed">Failed</option>
                <option value="Retry Needed">Retry Needed</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedStageFilter !== 'All' || selectedStatusFilter !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStageFilter('All');
                  setSelectedStatusFilter('All');
                  setSearchQuery('');
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Farmers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Farmer & ID</th>
                <th className="py-3 px-3">Assigned Area</th>
                <th className="py-3 px-3">Crop & Land</th>
                <th className="py-3 px-3">Journey Stage</th>
                <th className="py-3 px-3">Call Status</th>
                <th className="py-3 px-3">Last Call Date/Time</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No farmer calling records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                    onClick={() => setActiveFarmerForModal(record)}
                  >
                    {/* Farmer Name & ID */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {record.farmerName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                        <span className="font-mono bg-gray-100 px-1 py-0.2 rounded text-[10px]">
                          {record.farmerId}
                        </span>
                        <span>•</span>
                        <span>{record.phone}</span>
                      </div>
                    </td>

                    {/* Area */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">{record.village}</div>
                      <div className="text-[11px] text-gray-500">
                        Tal. {record.taluka}, Dist. {record.district}
                      </div>
                    </td>

                    {/* Crop */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-emerald-950 flex items-center gap-1">
                        <Sprout className="w-3 h-3 text-emerald-600" />
                        {record.selectedCrop}
                      </div>
                      <div className="text-[11px] text-gray-500">{record.landAreaAcres} Acres</div>
                    </td>

                    {/* Journey Stage */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {record.currentStage}
                      </span>
                    </td>

                    {/* Call Status */}
                    <td className="py-3 px-3">{getStatusBadge(record.callStatus)}</td>

                    {/* Last Call */}
                    <td className="py-3 px-3 text-[11px] text-gray-600">
                      {record.lastCallDate ? (
                        <div>
                          <div>{record.lastCallDate}</div>
                          <div className="text-gray-400">{record.lastCallTime}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No calls yet</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {record.callStatus === 'Failed' || record.callStatus === 'Retry Needed' ? (
                          <button
                            type="button"
                            onClick={() => retryCallForFarmer(record.farmerId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-semibold transition-colors"
                            title="Retry failed call connection"
                          >
                            <RotateCcw className="w-3 h-3 text-orange-600" />
                            <span>Retry</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerCallForFarmer(record.farmerId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                            title="Initiate routine AI update call"
                          >
                            <PhoneCall className="w-3 h-3 text-emerald-600" />
                            <span>Call</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveFarmerForModal(record)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View farmer call history and details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for Selected Farmer */}
      {activeFarmerForModal && (
        <FarmerCallDetailModal
          record={activeFarmerForModal}
          onClose={() => setActiveFarmerForModal(null)}
          onTriggerCall={(fId) => triggerCallForFarmer(fId)}
          onRetryCall={(fId) => retryCallForFarmer(fId)}
          onAdvanceStage={(fId, stage) => advanceFarmerStage(fId, stage)}
        />
      )}
    </div>
  );
};
