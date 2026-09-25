import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageAppointmentRecord, StorageAppointmentStatus } from '../../types';
import { StorageAppointmentService } from '../../services/storageAppointmentService';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  X,
  Phone,
  Layers,
  Filter,
  RefreshCw,
  AlertCircle,
  Building2,
  Sparkles,
  Send,
  MessageSquare,
} from 'lucide-react';

export const StorageOwnerDashboardPage: React.FC = () => {
  const {
    session,
    storageFacilities,
    appointments,
    refreshAppointments,
    approveStorageAppointment,
    rejectStorageAppointment,
    rescheduleStorageAppointment,
  } = useApp();

  const facilityId = session.storageOwnerFacilityId || 'cs-001';
  const facility = storageFacilities.find((f) => f.id === facilityId) || storageFacilities[0];

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Modals state
  const [rejectModalApp, setRejectModalApp] = useState<StorageAppointmentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  const [rescheduleModalApp, setRescheduleModalApp] = useState<StorageAppointmentRecord | null>(null);
  const [proposedDate, setProposedDate] = useState<string>('');
  const [proposedTime, setProposedTime] = useState<string>('11:00 AM');
  const [rescheduleNote, setRescheduleNote] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Filter appointments for this facility
  const facilityAppointments = useMemo(() => {
    return appointments.filter((a) => a.facilityId === facilityId);
  }, [appointments, facilityId]);

  const filteredAppointments = useMemo(() => {
    return facilityAppointments.filter((a) => {
      const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
      const matchesSearch =
        searchQuery === '' ||
        a.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.farmerPhone.includes(searchQuery) ||
        a.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [facilityAppointments, filterStatus, searchQuery]);

  // Counts for summary metrics
  const counts = useMemo(() => {
    return {
      all: facilityAppointments.length,
      pending: facilityAppointments.filter((a) => a.status === 'Pending').length,
      approved: facilityAppointments.filter((a) => a.status === 'Approved').length,
      reschedule: facilityAppointments.filter((a) => a.status === 'Reschedule Requested').length,
      rejected: facilityAppointments.filter((a) => a.status === 'Rejected').length,
    };
  }, [facilityAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAppointments();
    setIsRefreshing(false);
  };

  // 1. Action: Approve
  const handleApprove = async (app: StorageAppointmentRecord) => {
    setIsSubmittingAction(true);
    try {
      await approveStorageAppointment(app.id);
      setActionSuccessNotice(`Appointment for ${app.farmerName} (${app.quantityQuintals} Qtl ${app.crop}) approved successfully!`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to approve appointment.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 2. Action: Open Reject Modal
  const handleOpenRejectModal = (app: StorageAppointmentRecord) => {
    setRejectModalApp(app);
    setRejectionReason('Storage capacity full for this crop variety during the requested intake week.');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalApp || !rejectionReason.trim()) return;

    setIsSubmittingAction(true);
    try {
      await rejectStorageAppointment(rejectModalApp.id, rejectionReason.trim());
      setRejectModalApp(null);
      setActionSuccessNotice(`Appointment request #${rejectModalApp.id} was rejected with reason provided to farmer.`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to reject appointment.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 3. Action: Open Reschedule Modal
  const handleOpenRescheduleModal = (app: StorageAppointmentRecord) => {
    setRescheduleModalApp(app);
    const d = new Date(app.preferredDate);
    d.setDate(d.getDate() + 3);
    setProposedDate(d.toISOString().split('T')[0]);
    setProposedTime('02:00 PM');
    setRescheduleNote('Morning slots occupied by APMC lot intake; afternoon slot confirmed available.');
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalApp || !proposedDate || !proposedTime) return;

    setIsSubmittingAction(true);
    try {
      await rescheduleStorageAppointment(
        rescheduleModalApp.id,
        proposedDate,
        proposedTime,
        rescheduleNote.trim() || undefined
      );
      setRescheduleModalApp(null);
      setActionSuccessNotice(
        `Proposed alternative schedule (${proposedDate} at ${proposedTime}) sent to ${rescheduleModalApp.farmerName} for review.`
      );
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to propose alternative time.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const minProposedDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Banner / Success Notification */}
      {actionSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-emerald-200 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Facility Welcome & Metrics Overview */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0C79B]/50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B] text-[#F8E7C9] text-xs font-bold">
                Facility ID: {facility?.id}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#064E3B]">
                Appointment Requests & Intake Management
              </h2>
            </div>
            <p className="text-xs text-[#064E3B]/70 mt-1">
              Review, approve, reject, or propose alternative intake dates for farmer crop storage requests at{' '}
              <strong>{facility?.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={async () => {
                StorageAppointmentService.resetToDefaults();
                await refreshAppointments();
                setActionSuccessNotice('All demo appointment requests reset to Pending status.');
                setTimeout(() => setActionSuccessNotice(null), 4000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E0C79B] text-xs font-semibold text-slate-700 hover:bg-[#F8E7C9] transition-colors shadow-2xs cursor-pointer"
              title="Reset all requests to fresh Pending state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#064E3B]" />
              <span>Reset Requests</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E0C79B] text-xs font-bold text-[#064E3B] hover:bg-[#F8E7C9] transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Requests'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
              Pending Review
            </span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">
              {counts.pending}
            </span>
            <span className="text-[10px] text-amber-700/80">Awaiting your response</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              Approved
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">
              {counts.approved}
            </span>
            <span className="text-[10px] text-emerald-700/80">Confirmed intake appointments</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
              Reschedule Requested
            </span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">
              {counts.reschedule}
            </span>
            <span className="text-[10px] text-blue-700/80">Under date/time negotiation</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Recorded
            </span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {counts.all}
            </span>
            <span className="text-[10px] text-slate-500">Across this facility</span>
          </div>
        </div>
      </div>

      {/* Appointment Requests Section */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Controls Bar: Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-[#E0C79B]/50 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {[
              { id: 'All', label: `All (${counts.all})` },
              { id: 'Pending', label: `Pending (${counts.pending})` },
              { id: 'Approved', label: `Approved (${counts.approved})` },
              { id: 'Reschedule Requested', label: `Reschedule (${counts.reschedule})` },
              { id: 'Rejected', label: `Rejected (${counts.rejected})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  filterStatus === tab.id
                    ? 'bg-[#064E3B] text-[#F8E7C9] shadow-2xs'
                    : 'bg-white border border-[#E0C79B] text-slate-700 hover:bg-[#F8E7C9]/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search farmer, phone, crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E0C79B] rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
            />
          </div>
        </div>

        {/* Requests List */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#E0C79B] rounded-2xl space-y-2 text-[#064E3B]/70">
            <Building2 className="w-12 h-12 mx-auto text-[#064E3B]/30" />
            <h4 className="text-sm font-bold text-slate-800">No Appointment Requests Match Filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterStatus === 'All'
                ? 'No farmer appointment requests registered for this cold storage facility yet.'
                : `No requests with status "${filterStatus}" currently registered.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-[#E0C79B] p-4 sm:p-5 shadow-2xs space-y-3 hover:border-[#064E3B] transition-all"
              >
                {/* Row 1: Farmer & Crop Details + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{app.farmerName}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">ID: {app.farmerId}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-[#064E3B]">
                        <Phone className="w-3.5 h-3.5 text-[#064E3B]" />
                        +91 {app.farmerPhone}
                      </span>
                      <span>•</span>
                      <span>
                        Crop: <strong className="text-slate-900">{app.crop}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Quantity: <strong className="text-slate-900">{app.quantityQuintals} Quintals</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {app.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Pending Review</span>
                      </span>
                    )}
                    {app.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Approved & Confirmed</span>
                      </span>
                    )}
                    {app.status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rejected</span>
                      </span>
                    )}
                    {app.status === 'Reschedule Requested' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Reschedule Requested</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Timing details & additional details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Requested Date & Time:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {app.preferredDate} at {app.preferredTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Request Submitted:</span>
                    <span className="text-slate-700 block mt-0.5">
                      {formatDate(app.createdAt)}
                    </span>
                  </div>

                  <div>
                    {app.status === 'Approved' ? (
                      <div>
                        <span className="text-emerald-700 block text-[11px] font-bold">Confirmed Intake Slot:</span>
                        <span className="font-bold text-emerald-900 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {app.confirmedDate || app.preferredDate} at {app.confirmedTime || app.preferredTime}
                        </span>
                      </div>
                    ) : app.status === 'Reschedule Requested' ? (
                      <div>
                        <span className="text-blue-700 block text-[11px] font-bold">Proposed Alternative:</span>
                        <span className="font-bold text-blue-900 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {app.proposedAlternativeDate || app.preferredDate} at {app.proposedAlternativeTime || app.preferredTime}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Last Updated:</span>
                        <span className="text-slate-600 block mt-0.5">{formatDate(app.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {app.additionalDetails && (
                    <div className="sm:col-span-3 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                      <strong>Farmer Details & Notes:</strong> {app.additionalDetails}
                    </div>
                  )}
                </div>

                {/* Rejection Note Display */}
                {app.status === 'Rejected' && app.rejectionReason && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                    <span className="font-bold block flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Recorded Rejection Reason (Visible to Farmer):
                    </span>
                    <p className="italic pl-5">&quot;{app.rejectionReason}&quot;</p>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-1 flex flex-wrap items-center justify-end gap-2.5">
                  {/* Approve button */}
                  {app.status !== 'Approved' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleApprove(app)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold hover:bg-[#08634B] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {/* Suggest Another Date or Time button */}
                  {app.status !== 'Approved' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleOpenRescheduleModal(app)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
                      <span>Suggest Another Date or Time</span>
                    </button>
                  )}

                  {/* Reject button */}
                  {app.status !== 'Rejected' && (
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleOpenRejectModal(app)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Reject Appointment Modal */}
      {rejectModalApp && (
        <Modal
          isOpen={!!rejectModalApp}
          onClose={() => setRejectModalApp(null)}
          title="Reject Appointment Request"
          subtitle={`Farmer: ${rejectModalApp.farmerName} • ID: ${rejectModalApp.id}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Please specify the rejection reason. This message will be displayed directly to the farmer in their portal.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Rejection Reason: *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Cold storage chamber undergoing scheduled maintenance on this date..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAction}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Suggest Another Date or Time Modal */}
      {rescheduleModalApp && (
        <Modal
          isOpen={!!rescheduleModalApp}
          onClose={() => setRescheduleModalApp(null)}
          title="Suggest Another Date or Time"
          subtitle={`Farmer: ${rescheduleModalApp.farmerName} • Requested: ${rescheduleModalApp.preferredDate}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Propose an alternative appointment slot for this farmer. The status will update to{' '}
              <strong className="text-blue-900">&quot;Reschedule Requested&quot;</strong> and the farmer can accept or counter-propose.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Proposed Alternative Date: *</label>
                <input
                  type="date"
                  min={minProposedDate}
                  required
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Proposed Time Slot: *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 02:30 PM"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Explanation / Note for Farmer (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bay 2 intake available on this afternoon..."
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRescheduleModalApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAction}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Proposed Schedule</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
