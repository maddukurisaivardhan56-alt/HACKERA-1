import React, { useState } from 'react';
import {
  FarmerCallingRecord,
  AICallingJourneyStage,
  IndividualCallStatus,
} from '../../types';
import { CallingJourneyService, STAGES_ORDER } from '../../services/callingJourneyService';
import {
  X,
  Phone,
  PhoneCall,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  Sprout,
  ShieldCheck,
  FileText,
  AlertCircle,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FarmerCallDetailModalProps {
  record: FarmerCallingRecord;
  onClose: () => void;
  onTriggerCall: (farmerId: string) => void;
  onRetryCall: (farmerId: string) => void;
  onAdvanceStage: (farmerId: string, stage: AICallingJourneyStage) => void;
}

export const FarmerCallDetailModal: React.FC<FarmerCallDetailModalProps> = ({
  record,
  onClose,
  onTriggerCall,
  onRetryCall,
  onAdvanceStage,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedSubject, setReportedSubject] = useState('');
  const [reportedDescription, setReportedDescription] = useState('');
  const [agreeAppointment, setAgreeAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [complaintSuccessId, setComplaintSuccessId] = useState<string | null>(null);

  const currentStageIndex = STAGES_ORDER.indexOf(record.currentStage);

  const getStatusBadge = (status: IndividualCallStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'Connected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
            <PhoneCall className="w-3.5 h-3.5 text-green-600 animate-pulse" />
            Connected
          </span>
        );
      case 'Calling':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Phone className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
            Calling
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Scheduled
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Failed
          </span>
        );
      case 'Retry Needed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
            Retry Needed
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            Not Started
          </span>
        );
    }
  };

  const handleReportProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportedSubject.trim() || !reportedDescription.trim()) return;

    const compId = CallingJourneyService.reportProblemFromCall({
      farmerId: record.farmerId,
      farmerName: record.farmerName,
      phone: record.phone,
      village: record.village,
      taluka: record.taluka,
      district: record.district,
      crop: record.selectedCrop,
      landAreaAcres: record.landAreaAcres,
      subject: reportedSubject,
      description: reportedDescription,
      appointmentAgreed: agreeAppointment,
      appointmentDate: agreeAppointment ? appointmentDate : undefined,
      appointmentTime: agreeAppointment ? appointmentTime : undefined,
    });

    setComplaintSuccessId(compId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#08634B] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-white font-bold text-lg">
              {record.farmerName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{record.farmerName}</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-800/80 text-emerald-200 border border-emerald-600/40">
                  {record.farmerId}
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {record.village}, Tal. {record.taluka}, Dist. {record.district}
                </span>
                <span className="text-emerald-400/60">•</span>
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                <span>{record.phone}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-xs text-emerald-700 block font-medium">Selected Crop</span>
              <span className="text-base font-bold text-emerald-950 flex items-center gap-1 mt-0.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                {record.selectedCrop} ({record.landAreaAcres} Ac)
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-xs text-gray-500 block font-medium">Calling Status</span>
              <div className="mt-1">{getStatusBadge(record.callStatus)}</div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <span className="text-xs text-blue-700 block font-medium">Last Call Attempt</span>
              <span className="text-xs font-bold text-blue-950 block mt-1">
                {record.lastCallDate ? `${record.lastCallDate} at ${record.lastCallTime}` : 'Not yet called'}
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <span className="text-xs text-amber-700 block font-medium">Advisory Consent</span>
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                {record.consentForAdvisory ? 'Consented (Marathi)' : 'Opted Out'}
              </span>
            </div>
          </div>

          {/* Six Stages Progress Tracker */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                6-Stage AI Calling Journey Progression
              </h4>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Current: {record.currentStage}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {STAGES_ORDER.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div
                    key={stage}
                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-semibold'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <span className="w-3.5 h-3.5 rounded-full bg-white text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <span className="font-mono text-[10px] opacity-80">Stage {idx + 1}</span>
                    </div>
                    <p className={`line-clamp-2 leading-tight ${isCurrent ? 'text-white' : ''}`}>
                      {stage.replace(/^\d+\.\s*/, '')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collected Crop Information */}
          {record.collectedCropInfo && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                AI-Collected Crop & Farm Intelligence
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 block">Soil Type:</span>
                  <span className="font-semibold text-gray-800">{record.collectedCropInfo.soilType || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 block">Crop Variety:</span>
                  <span className="font-semibold text-gray-800">{record.collectedCropInfo.cropVariety || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 block">Growth Stage:</span>
                  <span className="font-semibold text-gray-800">{record.collectedCropInfo.growthStage || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 block">Irrigation Method:</span>
                  <span className="font-semibold text-gray-800">{record.collectedCropInfo.irrigationMethod || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 block">Harvest Window:</span>
                  <span className="font-semibold text-gray-800">{record.collectedCropInfo.estimatedHarvestMonth || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg col-span-2 sm:col-span-1">
                  <span className="text-amber-800 font-medium block">Active Problems:</span>
                  <span className="text-amber-950 font-semibold">{record.collectedCropInfo.activeIssues || 'None observed'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Call History Audit Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Call History & Transcripts Log ({record.callHistory.length})
              </h4>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {record.callHistory.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-3 text-center bg-gray-50 rounded-lg">
                  No previous call records recorded for this farmer.
                </p>
              ) : (
                record.callHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-gray-50 hover:bg-gray-100/70 transition-colors border border-gray-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {log.stage}
                      </span>
                      <div className="flex items-center gap-2 text-gray-500">
                        {log.durationSeconds !== undefined && (
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                            {log.durationSeconds}s
                          </span>
                        )}
                        <span className="text-gray-600">{log.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">{log.summary}</p>

                    {log.failureReason && (
                      <div className="text-[11px] text-red-700 bg-red-50 p-1.5 rounded border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                        <span>{log.failureReason}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-sm transition-all"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Report Problem From Call</span>
          </button>

          <div className="flex items-center gap-2">
            {record.callStatus === 'Failed' || record.callStatus === 'Retry Needed' ? (
              <button
                type="button"
                onClick={() => onRetryCall(record.farmerId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Call Now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onTriggerCall(record.farmerId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Execute Next Routine Call</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-white text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Child Modal: Report Problem During AI Call & Schedule Visit */}
      {showReportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Farmer Reported Agricultural Problem
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setComplaintSuccessId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {complaintSuccessId ? (
              <div className="space-y-4 py-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Problem Registered Successfully!</span>
                  </div>
                  <p>
                    Complaint ID: <strong className="font-mono text-emerald-800">{complaintSuccessId}</strong>
                  </p>
                  <p className="text-xs text-emerald-700">
                    This problem has been filed into <strong>Farmer Support</strong> and is ready for officer field visit inspection.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Link
                    to="/admin/farmer-support"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
                  >
                    <span>View in Farmer Support</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setComplaintSuccessId(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportProblem} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Issue Subject / Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Purple Blotch fungal attack on onion bulbs"
                    value={reportedSubject}
                    onChange={(e) => setReportedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Problem Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe symptoms reported by the farmer during the voice call..."
                    value={reportedDescription}
                    onChange={(e) => setReportedDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Visit Scheduling section */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-950 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeAppointment}
                        onChange={(e) => setAgreeAppointment(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Farmer agreed upon visit schedule during call?</span>
                    </label>
                  </div>

                  {agreeAppointment ? (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">Agreed Date</label>
                        <input
                          type="date"
                          required={agreeAppointment}
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">Agreed Time Slot</label>
                        <input
                          type="text"
                          required={agreeAppointment}
                          placeholder="e.g. 10:30 AM"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-800 italic">
                      No visit date/time specified. Will be registered as <strong>Appointment Pending</strong> (no random date/time assigned).
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Problem & Open Complaint</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
