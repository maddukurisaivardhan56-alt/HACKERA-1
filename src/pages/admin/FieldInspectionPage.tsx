import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FieldInspectionRecord, FarmerSupportRequest } from '../../types';
import { INITIAL_FIELD_INSPECTIONS, INITIAL_SUPPORT_REQUESTS } from '../../data/initialOfficerData';
import { formatDate } from '../../utils/formatters';
import {
  ClipboardCheck,
  Plus,
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  X,
  FileCheck,
  Sprout,
  Activity,
  ChevronRight,
  Clock,
  Edit3,
  Check,
} from 'lucide-react';

export const FieldInspectionPage: React.FC = () => {
  const { currentLanguage, farmers } = useApp();
  const [inspections, setInspections] = useState<FieldInspectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fg_officer_field_inspections');
      if (saved) {
        const parsed: FieldInspectionRecord[] = JSON.parse(saved);
        return parsed.map((item) => {
          const init = INITIAL_FIELD_INSPECTIONS.find((i) => i.id === item.id);
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
      return INITIAL_FIELD_INSPECTIONS;
    } catch {
      return INITIAL_FIELD_INSPECTIONS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedHealth, setSelectedHealth] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<FieldInspectionRecord | null>(null);
  const [editRecordModal, setEditRecordModal] = useState<FieldInspectionRecord | null>(null);
  const [editRecText, setEditRecText] = useState('');
  const [editHealth, setEditHealth] = useState<FieldInspectionRecord['observedHealth']>('Good');
  const [editIssues, setEditIssues] = useState('');

  // New Inspection Form State
  const [newForm, setNewForm] = useState(() => {
    const f0 = farmers[0];
    return {
      farmerSelect: f0?.id || '',
      farmerName: f0?.name || '',
      phone: f0?.phone || '',
      village: f0?.village || '',
      taluka: f0?.taluka || '',
      district: f0?.district || '',
      crop: f0?.primaryCrop || 'Soybean',
      landAreaAcres: f0?.landAreaAcres || 2.0,
      inspectionDate: new Date().toISOString().split('T')[0],
      cropGrowthStage: 'Bulb Development' as FieldInspectionRecord['cropGrowthStage'],
      observedHealth: 'Good' as FieldInspectionRecord['observedHealth'],
      reportedIssues: '',
      officerRecommendations: '',
      officerName: 'S. K. Kulkarni (Agriculture Officer)',
      followUpRequired: false,
      appointmentStatus: 'Visit Completed' as FieldInspectionRecord['appointmentStatus'],
    };
  });

  // Sync state if storage changes or custom event is fired
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('fg_officer_field_inspections');
        if (saved) {
          setInspections(JSON.parse(saved));
        }
      } catch {}
    };

    window.addEventListener('fg_inspection_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('fg_inspection_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const saveInspections = (updated: FieldInspectionRecord[]) => {
    setInspections(updated);
    try {
      localStorage.setItem('fg_officer_field_inspections', JSON.stringify(updated));
      window.dispatchEvent(new Event('fg_inspection_updated'));
    } catch {}
  };

  const syncToSupportRequests = (record: FieldInspectionRecord, isCompleted: boolean) => {
    try {
      const saved = localStorage.getItem('fg_officer_support_requests');
      const list: FarmerSupportRequest[] = saved ? JSON.parse(saved) : [...INITIAL_SUPPORT_REQUESTS];
      const matchIdx = list.findIndex(
        (r) =>
          (record.complaintId && r.id === record.complaintId) ||
          r.id === record.id ||
          r.farmerId === record.farmerId ||
          r.farmerName.toLowerCase() === record.farmerName.toLowerCase()
      );
      if (matchIdx >= 0) {
        list[matchIdx] = {
          ...list[matchIdx],
          officerGuidance: record.officerRecommendations,
          status: isCompleted ? 'Resolved' : list[matchIdx].status,
          appointmentStatus: isCompleted ? 'Visit Completed' : record.appointmentStatus,
          visitCompletedDate: isCompleted ? new Date().toISOString().split('T')[0] : list[matchIdx].visitCompletedDate,
        };
        localStorage.setItem('fg_officer_support_requests', JSON.stringify(list));
        window.dispatchEvent(new Event('fg_support_updated'));
      }
    } catch (err) {
      console.error('Failed to sync to support requests:', err);
    }
  };

  const handleFarmerChange = (farmerId: string) => {
    const f = farmers.find((farmer) => farmer.id === farmerId);
    if (f) {
      setNewForm((prev) => ({
        ...prev,
        farmerSelect: f.id,
        farmerName: f.name,
        phone: f.phone,
        village: f.village,
        taluka: f.taluka,
        district: f.district,
        crop: f.primaryCrop,
        landAreaAcres: f.landAreaAcres,
      }));
    }
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.farmerName.trim() || !newForm.officerRecommendations.trim()) {
      alert('Please fill out farmer details and officer recommendations.');
      return;
    }

    const newRecord: FieldInspectionRecord = {
      id: `insp-${Date.now().toString().slice(-4)}`,
      farmerId: newForm.farmerSelect,
      farmerName: newForm.farmerName,
      phone: newForm.phone,
      village: newForm.village,
      taluka: newForm.taluka,
      district: newForm.district,
      crop: newForm.crop,
      landAreaAcres: Number(newForm.landAreaAcres) || 1,
      inspectionDate: newForm.inspectionDate,
      cropGrowthStage: newForm.cropGrowthStage,
      observedHealth: newForm.observedHealth,
      reportedIssues: newForm.reportedIssues.trim() || 'No severe abnormalities observed during visit.',
      officerRecommendations: newForm.officerRecommendations.trim(),
      officerName: newForm.officerName.trim(),
      followUpRequired: newForm.followUpRequired,
    };

    const updated = [newRecord, ...inspections];
    saveInspections(updated);
    setShowAddModal(false);
    // Reset issues & recommendations for next record
    setNewForm((prev) => ({
      ...prev,
      reportedIssues: '',
      officerRecommendations: '',
      followUpRequired: false,
    }));
  };

  const openEditModal = (record: FieldInspectionRecord) => {
    setEditRecordModal(record);
    setEditRecText(record.officerRecommendations || '');
    setEditHealth(record.observedHealth);
    setEditIssues(record.reportedIssues || '');
  };

  const handleSaveEditInspection = (isCompleteVisit: boolean) => {
    if (!editRecordModal) return;

    const updatedRecord: FieldInspectionRecord = {
      ...editRecordModal,
      officerRecommendations: editRecText.trim(),
      observedHealth: editHealth,
      reportedIssues: editIssues.trim(),
      appointmentStatus: isCompleteVisit ? 'Visit Completed' : editRecordModal.appointmentStatus,
      inspectionDate: new Date().toISOString().split('T')[0],
      followUpRequired: isCompleteVisit ? false : editRecordModal.followUpRequired,
    };

    const updatedList = inspections.map((item) =>
      item.id === editRecordModal.id ? updatedRecord : item
    );

    saveInspections(updatedList);
    syncToSupportRequests(updatedRecord, isCompleteVisit);
    setEditRecordModal(null);
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        (item.complaintId && item.complaintId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reportedIssues.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.officerRecommendations.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCrop = selectedCrop === 'All' || item.crop === selectedCrop;
      const matchesHealth = selectedHealth === 'All' || item.observedHealth === selectedHealth;

      return matchesSearch && matchesCrop && matchesHealth;
    });
  }, [inspections, searchQuery, selectedCrop, selectedHealth]);

  const getHealthBadge = (health: FieldInspectionRecord['observedHealth']) => {
    switch (health) {
      case 'Excellent':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Good':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Stressed':
      case 'Poor':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Critical':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064E3B] via-[#08634B] to-[#0a7a5d] rounded-2xl p-6 text-white shadow-lg shadow-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-sm mb-3">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>
                {currentLanguage === 'mr'
                  ? 'शेत तपासणी व पाहणी नोंदणी'
                  : currentLanguage === 'hi'
                  ? 'खेत निरीक्षण एवं सर्वेक्षण'
                  : 'Field Inspection & Farm Monitoring'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {currentLanguage === 'mr'
                ? 'शेत प्रत्यक्ष पाहणी व पीक निरीक्षण अहवाल'
                : currentLanguage === 'hi'
                ? 'खेत निरीक्षण एवं फसल निगरानी रिपोर्ट'
                : 'Field Inspections & Crop Monitoring'}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {currentLanguage === 'mr'
                ? 'कृषी अधिकाऱ्यांनी प्रत्यक्ष शेतावर जाऊन केलेल्या पाहणी नोंदी, पिकांची आरोग्य स्थिती आणि दिलेल्या तांत्रिक शिफारशींचे व्यवस्थापन.'
                : currentLanguage === 'hi'
                ? 'कृषि अधिकारियों द्वारा खेतों के प्रत्यक्ष निरीक्षण, फसल स्वास्थ्य स्थिति और दिए गए तकनीकी सुझावों का प्रबंधन।'
                : 'Record on-site farm visits, monitor crop growth stages, document pest or stress symptoms, and track field advisories.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#064E3B] text-xs font-bold shadow hover:bg-emerald-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>
                {currentLanguage === 'mr'
                  ? 'नवीन शेत पाहणी नोंदवा'
                  : currentLanguage === 'hi'
                  ? 'नया खेत निरीक्षण दर्ज करें'
                  : 'Record New Farm Inspection'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-200 block font-medium">Total Inspections</span>
            <span className="text-xl font-bold">{inspections.length} Recorded</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-200 block font-medium">Follow-Up Visits</span>
            <span className="text-xl font-bold">
              {inspections.filter((i) => i.followUpRequired).length} Required
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-200 block font-medium">Healthy Crops</span>
            <span className="text-xl font-bold">
              {inspections.filter((i) => i.observedHealth === 'Excellent' || i.observedHealth === 'Good').length} Farms
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-200 block font-medium">Issues Addressed</span>
            <span className="text-xl font-bold">100% Advisory Given</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Crop Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Crops</option>
              <option value="Onion">Onion</option>
              <option value="Soybean">Soybean</option>
              <option value="Tomato">Tomato</option>
              <option value="Pomegranate">Pomegranate</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Crop Health:</span>
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Health Status</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Moderate">Moderate</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              currentLanguage === 'mr'
                ? 'शेतकरी, गाव, पीक किंवा अधिकारी शोधा...'
                : currentLanguage === 'hi'
                ? 'किसान, गांव, फसल या अधिकारी खोजें...'
                : 'Search farmer, village, crop...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Field Inspection Records Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#064E3B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {currentLanguage === 'mr'
                ? 'प्रत्यक्ष शेत पाहणी नोंदी यादी'
                : currentLanguage === 'hi'
                ? 'खेत निरीक्षण सूची'
                : 'Field Inspection Survey Ledger'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredInspections.length} of {inspections.length} visits
          </span>
        </div>

        {filteredInspections.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Inspection Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Record New Farm Inspection&quot; to log your first field visit.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInspections.map((record) => (
              <div
                key={record.id}
                className="p-5 hover:bg-slate-50/60 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Farmer & Location Info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        ID: {record.complaintId || record.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#064E3B]" />
                        {record.farmerName}
                      </span>
                      <span className="text-xs text-slate-400">({record.farmerId})</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {record.crop} ({record.landAreaAcres} Acres)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getHealthBadge(
                          record.observedHealth
                        )}`}
                      >
                        {record.observedHealth} Health
                      </span>
                      {record.followUpRequired && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Follow-Up Needed
                        </span>
                      )}
                    </div>

                    {/* Appointment Status Pill (Fixed by AI - View Only by Admin) */}
                    <div className="flex items-center gap-2">
                      {record.appointmentStatus === 'Visit Scheduled' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>
                            Visit Scheduled by AI: <strong className="text-emerald-950">{formatDate(record.appointmentDate || record.inspectionDate)}</strong>
                            {record.appointmentTime ? ` at ${record.appointmentTime}` : ''}
                          </span>
                        </span>
                      ) : record.appointmentStatus === 'Visit Completed' ? (
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

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {record.village}, Tal. {record.taluka}, Dist. {record.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {record.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Visited: {formatDate(record.inspectionDate)}
                      </span>
                    </div>
                  </div>

                  {/* Growth Stage Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">Growth Stage:</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      {record.cropGrowthStage}
                    </span>
                  </div>
                </div>

                {/* Observations & Findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Field Issues Observed:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{record.reportedIssues}</p>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Officer Recommendations & Guidance:
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-1.5 py-0.2 rounded">
                        Live Synced
                      </span>
                    </div>
                    <p className="text-emerald-950 leading-relaxed font-medium">
                      {record.officerRecommendations || 'No recommendations recorded yet.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Officer Signature & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <span>Inspected by: <strong className="text-slate-700">{record.officerName}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(record)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-700" />
                      <span>Update Advice / Visit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDetailModal(record)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>View Inspection Card</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record New Farm Inspection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentLanguage === 'mr'
                    ? 'नवीन शेत पाहणी नोंदणी फॉर्म'
                    : currentLanguage === 'hi'
                    ? 'नया खेत निरीक्षण प्रपत्र'
                    : 'Record New Farm Visit & Field Inspection'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record on-site findings, crop health diagnosis, and technical advice for the farmer.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
              {/* Farmer Quick Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="font-bold text-slate-700 block">
                  Select Registered Farmer (Auto-populates farm data):
                </label>
                <select
                  value={newForm.farmerSelect}
                  onChange={(e) => handleFarmerChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.primaryCrop} ({f.landAreaAcres} Acres, {f.village}, {f.taluka})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid: Location & Field Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Village:</label>
                  <input
                    type="text"
                    value={newForm.village}
                    onChange={(e) => setNewForm({ ...newForm, village: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Taluka:</label>
                  <input
                    type="text"
                    value={newForm.taluka}
                    onChange={(e) => setNewForm({ ...newForm, taluka: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District:</label>
                  <input
                    type="text"
                    value={newForm.district}
                    onChange={(e) => setNewForm({ ...newForm, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Grid: Crop & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Crop:</label>
                  <input
                    type="text"
                    value={newForm.crop}
                    onChange={(e) => setNewForm({ ...newForm, crop: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Growth Stage:</label>
                  <select
                    value={newForm.cropGrowthStage}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        cropGrowthStage: e.target.value as FieldInspectionRecord['cropGrowthStage'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="Sowing / Nursery">Sowing / Nursery</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Bulb Development">Bulb Development</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Pod Filling / Fruit Dev">Pod Filling / Fruit Dev</option>
                    <option value="Maturity / Harvest Ready">Maturity / Harvest Ready</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Inspection Date:</label>
                  <input
                    type="date"
                    value={newForm.inspectionDate}
                    onChange={(e) => setNewForm({ ...newForm, inspectionDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Observed Health & Officer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Observed Crop Health:</label>
                  <select
                    value={newForm.observedHealth}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        observedHealth: e.target.value as FieldInspectionRecord['observedHealth'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Officer Name & Designation:</label>
                  <input
                    type="text"
                    value={newForm.officerName}
                    onChange={(e) => setNewForm({ ...newForm, officerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Reported Issues */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Field Observations / Pest / Disease Symptoms Observed:
                </label>
                <textarea
                  rows={2}
                  value={newForm.reportedIssues}
                  onChange={(e) => setNewForm({ ...newForm, reportedIssues: e.target.value })}
                  placeholder="e.g. Minor purple blotch patches on leaves, moisture deficit in furrow..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                />
              </div>

              {/* Officer Recommendations */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Officer Technical Guidance & Recommendations: *
                </label>
                <textarea
                  rows={3}
                  value={newForm.officerRecommendations}
                  onChange={(e) => setNewForm({ ...newForm, officerRecommendations: e.target.value })}
                  placeholder="e.g. Prescribe Mancozeb 75% WP @ 2.5 gm/L, schedule light irrigation after 48 hours..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                  required
                />
              </div>

              {/* Follow-up Required Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="followUpCheck"
                  checked={newForm.followUpRequired}
                  onChange={(e) => setNewForm({ ...newForm, followUpRequired: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="followUpCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Schedule follow-up visit required within 7–10 days
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#064E3B] text-xs font-bold text-white hover:bg-[#08634B] shadow flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Inspection Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Card Modal */}
      {viewDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {viewDetailModal.id}
                </span>
                <span className="ml-2 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Complaint ID: {viewDetailModal.complaintId || viewDetailModal.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Field Inspection Card — {viewDetailModal.farmerName}
                </h3>
              </div>
              <button
                onClick={() => setViewDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div><strong>Farmer:</strong> {viewDetailModal.farmerName} ({viewDetailModal.farmerId})</div>
                <div><strong>Location:</strong> {viewDetailModal.village}, {viewDetailModal.taluka}, {viewDetailModal.district}</div>
                <div><strong>Crop:</strong> {viewDetailModal.crop} ({viewDetailModal.landAreaAcres} Acres)</div>
                <div><strong>Stage:</strong> {viewDetailModal.cropGrowthStage}</div>
                <div><strong>Observed Health:</strong> {viewDetailModal.observedHealth}</div>
                <div><strong>Date of Visit:</strong> {formatDate(viewDetailModal.inspectionDate)}</div>
                <div>
                  <strong>Appointment Status:</strong>{' '}
                  <span className="font-semibold text-emerald-800">
                    {viewDetailModal.appointmentStatus || 'Appointment Pending'}
                  </span>
                  {viewDetailModal.appointmentDate && ` (${formatDate(viewDetailModal.appointmentDate)}${viewDetailModal.appointmentTime ? ` at ${viewDetailModal.appointmentTime}` : ''})`}
                </div>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-800">Field Findings:</strong>
                <p className="text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                  {viewDetailModal.reportedIssues}
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-emerald-900">Officer Recommendations:</strong>
                <p className="text-emerald-950 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium">
                  {viewDetailModal.officerRecommendations}
                </p>
              </div>

              <div className="text-slate-500 text-[11px]">
                Recorded by: <strong>{viewDetailModal.officerName}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-[#064E3B] text-xs font-bold text-white hover:bg-[#08634B]"
              >
                Close Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Advice & Complete Inspection Modal */}
      {editRecordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Complaint / Visit ID: {editRecordModal.complaintId || editRecordModal.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Update Recommendations & Complete Visit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Farmer: <strong className="text-slate-800">{editRecordModal.farmerName}</strong> ({editRecordModal.crop} • {editRecordModal.village})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditRecordModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Observed Crop Health:
                </label>
                <select
                  value={editHealth}
                  onChange={(e) => setEditHealth(e.target.value as FieldInspectionRecord['observedHealth'])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Poor">Poor</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Field Observations & Issue Diagnosis:
                </label>
                <textarea
                  rows={2}
                  value={editIssues}
                  onChange={(e) => setEditIssues(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Describe crop condition, pest symptoms, or root development..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Officer Recommendations & Technical Advisory: *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editRecText}
                  onChange={(e) => setEditRecText(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                  placeholder="Enter chemical dosage, bio-stimulants, or cultivation advice..."
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 These recommendations automatically synchronize back to Farmer Support for this farmer complaint.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleSaveEditInspection(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Save Guidance Only
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setEditRecordModal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditInspection(true)}
                  className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold hover:bg-[#043D2E] flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Visit Completed & Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
