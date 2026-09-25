import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { FarmerSupportRequest, FieldInspectionRecord } from '../../types';
import { INITIAL_SUPPORT_REQUESTS, INITIAL_FIELD_INSPECTIONS } from '../../data/initialOfficerData';
import { formatDate } from '../../utils/formatters';
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Send,
  X,
  Phone,
  MapPin,
  Sprout,
  Calendar,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export const FarmerSupportPage: React.FC = () => {
  const { currentLanguage, t } = useApp();
  const [requests, setRequests] = useState<FarmerSupportRequest[]>(() => {
    try {
      const saved = localStorage.getItem('fg_officer_support_requests');
      if (saved) {
        const parsed: FarmerSupportRequest[] = JSON.parse(saved);
        // Ensure any pre-existing cached records receive their initial appointment schedule
        return parsed.map((item) => {
          const init = INITIAL_SUPPORT_REQUESTS.find((i) => i.id === item.id);
          if (init && !item.appointmentStatus) {
            return {
              ...item,
              appointmentStatus: init.appointmentStatus,
              appointmentDate: init.appointmentDate,
              appointmentTime: init.appointmentTime,
            };
          }
          return item;
        });
      }
      return INITIAL_SUPPORT_REQUESTS;
    } catch {
      return INITIAL_SUPPORT_REQUESTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeRequestForGuidance, setActiveRequestForGuidance] = useState<FarmerSupportRequest | null>(null);
  const [guidanceText, setGuidanceText] = useState('');

  // Sync state if storage changes or custom event is fired
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('fg_officer_support_requests');
        if (saved) {
          setRequests(JSON.parse(saved));
        }
      } catch {}
    };

    window.addEventListener('fg_support_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('fg_support_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const saveRequests = (updated: FarmerSupportRequest[]) => {
    setRequests(updated);
    try {
      localStorage.setItem('fg_officer_support_requests', JSON.stringify(updated));
      window.dispatchEvent(new Event('fg_support_updated'));
    } catch {}
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || r.issueCategory === selectedCategory;
      const matchesStat = selectedStatus === 'All' || r.status === selectedStatus;
      return matchesSearch && matchesCat && matchesStat;
    });
  }, [requests, searchQuery, selectedCategory, selectedStatus]);

  const openGuidanceModal = (req: FarmerSupportRequest) => {
    setActiveRequestForGuidance(req);
    setGuidanceText(req.officerGuidance || '');
  };

  const handleSaveGuidance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestForGuidance) return;
    const text = guidanceText.trim();

    // 1. Update Farmer Support Requests
    const updated = requests.map((r) => {
      if (r.id === activeRequestForGuidance.id) {
        return {
          ...r,
          officerGuidance: text,
          status: 'Resolved' as const,
        };
      }
      return r;
    });
    saveRequests(updated);

    // 2. Synchronize directly into Field Inspection Records so it's immediately visible in Field Inspection & Monitoring (Pic 2)
    try {
      const savedInspections = localStorage.getItem('fg_officer_field_inspections');
      let inspectionsList: FieldInspectionRecord[] = savedInspections
        ? JSON.parse(savedInspections)
        : [...INITIAL_FIELD_INSPECTIONS];

      // Find matching inspection by complaint ID, farmerId, or farmerName
      const matchIdx = inspectionsList.findIndex(
        (insp) =>
          (insp.complaintId && insp.complaintId === activeRequestForGuidance.id) ||
          insp.farmerId === activeRequestForGuidance.farmerId ||
          insp.farmerName.toLowerCase() === activeRequestForGuidance.farmerName.toLowerCase()
      );

      if (matchIdx >= 0) {
        // Update existing record
        inspectionsList[matchIdx] = {
          ...inspectionsList[matchIdx],
          complaintId: activeRequestForGuidance.id,
          officerRecommendations: text,
          inspectionDate: new Date().toISOString().split('T')[0],
        };
      } else {
        // Create new inspection record under the same Complaint ID
        const newRecord: FieldInspectionRecord = {
          id: `insp-${Date.now().toString().slice(-4)}`,
          complaintId: activeRequestForGuidance.id,
          farmerId: activeRequestForGuidance.farmerId || 'FG-MH-001',
          farmerName: activeRequestForGuidance.farmerName,
          phone: activeRequestForGuidance.phone,
          village: activeRequestForGuidance.village,
          taluka: activeRequestForGuidance.taluka || 'Niphad',
          district: activeRequestForGuidance.district || 'Nashik',
          crop: activeRequestForGuidance.crop,
          landAreaAcres: activeRequestForGuidance.landAreaAcres || 2.0,
          inspectionDate: new Date().toISOString().split('T')[0],
          cropGrowthStage: 'Vegetative',
          observedHealth: 'Good',
          reportedIssues: activeRequestForGuidance.description,
          officerRecommendations: text,
          officerName: 'S. K. Kulkarni (Agriculture Officer)',
          followUpRequired: false,
          appointmentStatus: activeRequestForGuidance.appointmentStatus || 'Appointment Pending',
          appointmentDate: activeRequestForGuidance.appointmentDate,
          appointmentTime: activeRequestForGuidance.appointmentTime,
        };
        inspectionsList = [newRecord, ...inspectionsList];
      }

      localStorage.setItem('fg_officer_field_inspections', JSON.stringify(inspectionsList));
      window.dispatchEvent(new Event('fg_inspection_updated'));
    } catch (err) {
      console.error('Failed to sync inspection record:', err);
    }

    setActiveRequestForGuidance(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center shrink-0 shadow-xs">
              <HeartHandshake className="w-5 h-5 text-[#064E3B]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentLanguage === 'mr'
                  ? 'शेतकरी सहाय्य व मार्गदर्शन'
                  : currentLanguage === 'hi'
                  ? 'किसान सहायता एवं मार्गदर्शन'
                  : 'Farmer Support & Advisory'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentLanguage === 'mr'
                  ? 'शेतकऱ्यांच्या समस्यांचे पुनरावलोकन करा आणि पीक लागवड व शेतीविषयक मार्गदर्शन द्या.'
                  : currentLanguage === 'hi'
                  ? 'किसानों द्वारा दर्ज की गई समस्याओं की समीक्षा करें और फसल खेती का तकनीकी मार्गदर्शन प्रदान करें।'
                  : 'Review farmer-reported agricultural problems and provide crop cultivation guidance.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
            <span className="text-slate-400 font-medium mr-1.5">
              {currentLanguage === 'mr' ? 'एकूण विनंत्या:' : currentLanguage === 'hi' ? 'कुल अनुरोध:' : 'Total Requests:'}
            </span>
            <strong className="text-slate-900 font-bold">{requests.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs shadow-2xs">
            <span className="text-amber-800 font-medium mr-1.5">
              {currentLanguage === 'mr' ? 'प्रलंबित:' : currentLanguage === 'hi' ? 'लंबित:' : 'Pending:'}
            </span>
            <strong className="text-amber-900 font-bold">
              {requests.filter((r) => r.status !== 'Resolved').length}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Query */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentLanguage === 'mr' ? 'शेतकरी, गाव किंवा पीक शोधा' : currentLanguage === 'hi' ? 'किसान, गांव या फसल खोजें' : 'Search Farmer / Village / Crop'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Farmer, Lasalgaon, Onion..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentLanguage === 'mr' ? 'समस्येचा प्रकार' : currentLanguage === 'hi' ? 'समस्या का प्रकार' : 'Issue Category'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">{currentLanguage === 'mr' ? 'सर्व प्रकार' : currentLanguage === 'hi' ? 'सभी प्रकार' : 'All Categories'}</option>
              <option value="Pest & Disease">Pest & Disease (कीड व रोग)</option>
              <option value="Nutrient Deficiency">Nutrient Deficiency (पोषण कमतरता)</option>
              <option value="Irrigation & Weather">Irrigation & Weather (पाणी व हवामान)</option>
              <option value="Cultivation Practice">Cultivation Practice (लागवड पद्धती)</option>
              <option value="Market Guidance">Market Guidance (बाजार मार्गदर्शन)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentLanguage === 'mr' ? 'स्थिती' : currentLanguage === 'hi' ? 'स्थिति' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">{currentLanguage === 'mr' ? 'सर्व स्थिती' : currentLanguage === 'hi' ? 'सभी स्थिति' : 'All Statuses'}</option>
              <option value="Open">Open (नवीन)</option>
              <option value="In Review">In Review (तपासणी सुरू)</option>
              <option value="Resolved">Resolved (मार्गदर्शन पूर्ण)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm shadow-2xs space-y-2">
          <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">
            {currentLanguage === 'mr'
              ? 'कोणत्याही शेतकरी विनंत्या आढळल्या नाहीत.'
              : currentLanguage === 'hi'
              ? 'कोई किसान अनुरोध नहीं मिला।'
              : 'No farmer support requests found.'}
          </p>
          <p className="text-xs text-slate-400">
            {currentLanguage === 'mr'
              ? 'कृपया आपले शोध निकष किंवा फिल्टर तपासा.'
              : currentLanguage === 'hi'
              ? 'कृपया अपने फ़िल्टर या खोज मानदंड समायोजित करें।'
              : 'Try adjusting your search or category filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-emerald-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      ID: {req.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{req.subject}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        req.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : req.status === 'In Review'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {req.status === 'Resolved' ? '✓ Resolved' : req.status}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {req.issueCategory}
                    </span>
                  </div>

                  {/* Appointment Status Pill (Fixed by AI - View Only by Admin) */}
                  <div className="flex items-center gap-2 pt-0.5">
                    {req.appointmentStatus === 'Visit Scheduled' && req.appointmentDate ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        <span>
                          Visit Scheduled by AI: <strong className="text-emerald-950">{formatDate(req.appointmentDate)}</strong>
                          {req.appointmentTime ? ` at ${req.appointmentTime}` : ''}
                        </span>
                      </span>
                    ) : req.appointmentStatus === 'Visit Completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>Visit Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Appointment Pending (Awaiting AI Call / Farmer Agreement)</span>
                      </span>
                    )}
                  </div>

                  {/* Farmer Info Strip */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-medium">
                    <span className="text-slate-900 font-bold">{req.farmerName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {req.phone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.village}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      Crop: <strong className="text-slate-800 ml-0.5">{req.crop}</strong>
                    </span>
                    <span>•</span>
                    <span>Reported: {formatDate(req.submittedDate)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
                  <button
                    type="button"
                    onClick={() => openGuidanceModal(req)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#043D2E] transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {req.officerGuidance
                        ? (currentLanguage === 'mr' ? 'मार्गदर्शन अपडेट करा' : currentLanguage === 'hi' ? 'मार्गदर्शन अपडेट करें' : 'Update Guidance')
                        : (currentLanguage === 'mr' ? 'मार्गदर्शन द्या' : currentLanguage === 'hi' ? 'मार्गदर्शन प्रदान करें' : 'Provide Guidance')}
                    </span>
                  </button>

                  <Link
                    to="/admin/inspections"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
                    title="View in Field Inspection Ledger"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Inspect</span>
                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                  </Link>
                </div>
              </div>

              {/* Problem Description */}
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">
                  {currentLanguage === 'mr' ? 'शेतकऱ्याने नोंदवलेली समस्या:' : currentLanguage === 'hi' ? 'किसान द्वारा दर्ज समस्या:' : 'Reported Agricultural Issue:'}
                </span>
                {req.description}
              </div>

              {/* Existing Officer Guidance if present */}
              {req.officerGuidance && (
                <div className="text-xs text-emerald-950 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {currentLanguage === 'mr'
                          ? 'कृषी अधिकारी मार्गदर्शन व शिफारस (Field Inspection वर थेट सिंक):'
                          : currentLanguage === 'hi'
                          ? 'कृषि अधिकारी मार्गदर्शन एवं सिफारिश (Field Inspection पर लाइव सिंक):'
                          : 'Agriculture Officer Recommendation & Guidance (Synced to Field Inspection):'}
                      </span>
                    </div>
                    <Link
                      to="/admin/inspections"
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                    >
                      <span>Check in Field Inspection</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="leading-relaxed pl-5 text-emerald-900 font-medium">
                    {req.officerGuidance}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Guidance Input Modal */}
      {activeRequestForGuidance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {currentLanguage === 'mr' ? 'शेतीविषयक मार्गदर्शन नोंदवा' : currentLanguage === 'hi' ? 'खेती मार्गदर्शन दर्ज करें' : 'Provide Cultivation Guidance'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Farmer: <strong className="text-slate-800">{activeRequestForGuidance.farmerName}</strong> ({activeRequestForGuidance.crop} • {activeRequestForGuidance.village})
                </p>
                <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                  Complaint ID: {activeRequestForGuidance.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRequestForGuidance(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl text-slate-700 border border-slate-100 space-y-1">
              <strong>Problem:</strong> {activeRequestForGuidance.description}
            </div>

            <form onSubmit={handleSaveGuidance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {currentLanguage === 'mr' ? 'कृषी सल्ला व कीटकनाशक / खत शिफारस:' : currentLanguage === 'hi' ? 'कृषि सलाह एवं सिफारिश:' : 'Technical Agronomic Advice & Spray Schedule:'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={guidanceText}
                  onChange={(e) => setGuidanceText(e.target.value)}
                  placeholder="Enter chemical/organic spraying dosage, irrigation intervals, or crop management instructions..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed font-sans"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 What you save here will immediately reflect in the Field Inspection Survey Ledger under Officer Recommendations.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveRequestForGuidance(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#043D2E] shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {currentLanguage === 'mr' ? 'मार्गदर्शन जतन करा व पाठवा' : currentLanguage === 'hi' ? 'मार्गदर्शन सुरक्षित करें' : 'Save & Resolve Guidance'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
