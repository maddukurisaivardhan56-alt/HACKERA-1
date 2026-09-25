import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ColdStorageFacility, StorageAppointmentRecord } from '../../types';
import { formatINR } from '../../utils/formatters';
import { AlertBanner } from '../../components/common/AlertBanner';
import { NewEnquiryModal } from '../../components/advisory/NewEnquiryModal';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  MapPin,
  Send,
  Navigation,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Building2,
  RefreshCw,
  AlertCircle,
  Phone,
} from 'lucide-react';

export const ColdStoragePage: React.FC = () => {
  const {
    storageFacilities,
    activeFarmer,
    appointments,
    refreshAppointments,
    respondToStorageReschedule,
    t,
    currentLanguage,
  } = useApp();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [maxMonthlyRate, setMaxMonthlyRate] = useState<number>(120);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFacilityForEnquiry, setActiveFacilityForEnquiry] = useState<ColdStorageFacility | null>(null);

  // Farmer reschedule counter-proposal modal
  const [counterModalApp, setCounterModalApp] = useState<StorageAppointmentRecord | null>(null);
  const [counterDate, setCounterDate] = useState<string>('');
  const [counterTime, setCounterTime] = useState<string>('11:00 AM');
  const [counterNote, setCounterNote] = useState<string>('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Suitable storage facilities strictly filtered for active farmer's crop
  const cropFacilities = useMemo(() => {
    return storageFacilities.filter((f) =>
      f.suitableCrops.some((c) => c.toLowerCase() === activeFarmer.primaryCrop.toLowerCase())
    );
  }, [storageFacilities, activeFarmer.primaryCrop]);

  const districts = useMemo(
    () => Array.from(new Set(cropFacilities.map((s) => s.district))),
    [cropFacilities]
  );

  const filteredFacilities = useMemo(() => {
    return cropFacilities.filter((f) => {
      const matchesDistrict =
        selectedDistrict === 'All' || f.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchesRate = f.ratePerQuintalMonth <= maxMonthlyRate;
      const matchesSearch =
        searchQuery === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDistrict && matchesRate && matchesSearch;
    });
  }, [cropFacilities, selectedDistrict, maxMonthlyRate, searchQuery]);

  // Farmer's appointments strictly for active farmer
  const farmerAppointments = useMemo(() => {
    const cleanPhone = activeFarmer.phone.replace(/\D/g, '').slice(-10);
    return appointments.filter(
      (a) => a.farmerId === activeFarmer.id || a.farmerPhone.replace(/\D/g, '').endsWith(cleanPhone)
    );
  }, [appointments, activeFarmer.id, activeFarmer.phone]);

  const handleOpenGoogleMapsDirections = (facility: ColdStorageFacility) => {
    const query = encodeURIComponent(`${facility.name}, ${facility.location}, Maharashtra`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAcceptAlternative = async (appId: string) => {
    setIsActionLoading(true);
    try {
      await respondToStorageReschedule(appId, true);
      setActionSuccessNotice('Appointment successfully confirmed! Status is now Approved.');
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to accept alternative time.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenCounterModal = (app: StorageAppointmentRecord) => {
    setCounterModalApp(app);
    setCounterDate(app.proposedAlternativeDate || app.preferredDate);
    setCounterTime(app.proposedAlternativeTime || app.preferredTime);
    setCounterNote('');
  };

  const handleSubmitCounterProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalApp || !counterDate || !counterTime) return;

    setIsActionLoading(true);
    try {
      await respondToStorageReschedule(
        counterModalApp.id,
        false,
        counterDate,
        counterTime,
        counterNote.trim() || undefined
      );
      setCounterModalApp(null);
      setActionSuccessNotice('Your counter-schedule request has been sent to the owner for review.');
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Failed to submit counter request.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#064E3B] tracking-tight">
              {t('coldStorageTitle', 'Cold-Storage & Warehouse Facilities')}
            </h1>
          </div>
          <p className="text-xs text-[#064E3B]/70 mt-1">
            {t('coldStorageSubtitle', 'Search accredited preservation facilities in Maharashtra with transparent rental rates and real location directions.')}
          </p>
        </div>
      </div>

      {/* Transparency Banner */}
      <AlertBanner
        type="info"
        title={currentLanguage === 'mr' ? 'अधिकृत शीतगृह नेटवर्क' : currentLanguage === 'hi' ? 'मान्यता प्राप्त शीतगृह नेटवर्क' : 'Accredited Warehouse Network'}
        message={
          currentLanguage === 'mr'
            ? 'खालील शीतगृहांची यादी नाशिक, पुणे, अहमदनगर व सोलापूर जिल्ह्यातील अधिकृत शीतगृह केंद्रांची आहे. थेट गुगल मॅप्स दिशानिर्देश मिळवण्यासाठी "नकाशा / दिशानिर्देश" वर क्लिक करा.'
            : currentLanguage === 'hi'
            ? 'नीचे सूचीबद्ध शीतगृह नासिक, पुणे, अहमदनगर और सोलापुर जिलों के मान्यता प्राप्त कोल्ड चेन केंद्र हैं। गूगल मैप्स दिशा-निर्देश पाने के लिए "दिशा-निर्देश" पर क्लिक करें।'
            : 'Storage facilities listed below represent accredited cold chain units across Nashik, Pune, Ahmednagar, and Solapur. Click "Get Directions" to open exact routes on Google Maps.'
        }
      />

      {/* Filters Bar */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Crop Suitability - Locked to farmer's crop */}
          <div>
            <label className="block text-xs font-semibold text-[#064E3B] mb-1">
              {currentLanguage === 'mr' ? 'पीक अनुकूलता' : currentLanguage === 'hi' ? 'फसल उपयुक्तता' : 'Crop Suitability'}
            </label>
            <select
              value={activeFarmer.primaryCrop}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-[#E0C79B] text-xs font-semibold text-[#064E3B] bg-[#F8E7C9]/40 cursor-not-allowed"
            >
              <option value={activeFarmer.primaryCrop}>
                {activeFarmer.primaryCrop} ({t('farmerProfile', 'Farmer Crop')})
              </option>
            </select>
          </div>

          {/* District Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#064E3B] mb-1">
              {t('district', 'District Location')}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E0C79B] text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
            >
              <option value="All">{currentLanguage === 'mr' ? 'सर्व जिल्हे' : currentLanguage === 'hi' ? 'सभी जिले' : 'All Districts'}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Max Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#064E3B] mb-1">
              <span>{currentLanguage === 'mr' ? 'कमाल मासिक भाडे:' : currentLanguage === 'hi' ? 'अधिकतम मासिक किराया:' : 'Max Monthly Rent:'}</span>
              <span className="text-[#064E3B] font-bold">₹{maxMonthlyRate}/Qtl</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={maxMonthlyRate}
              onChange={(e) => setMaxMonthlyRate(Number(e.target.value))}
              className="w-full accent-[#064E3B] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#064E3B]/60">
              <span>₹50/mo</span>
              <span>₹150/mo</span>
            </div>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-xs font-semibold text-[#064E3B] mb-1">
              {currentLanguage === 'mr' ? 'शीतगृहाचे नाव शोधा' : currentLanguage === 'hi' ? 'शीतगृह का नाम खोजें' : 'Search by Facility Name'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Sahyadri, Lasalgaon..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E0C79B] text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Facilities Cards Grid */}
      {filteredFacilities.length === 0 ? (
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-12 text-center text-[#064E3B]/70 text-xs shadow-2xs space-y-2">
          <p className="font-semibold text-[#064E3B] text-sm">
            {cropFacilities.length === 0
              ? (currentLanguage === 'mr' ? 'या पिकासाठी माहिती उपलब्ध नाही' : currentLanguage === 'hi' ? 'इस फसल के लिए डेटा उपलब्ध नहीं है' : 'Data unavailable for this crop')
              : (currentLanguage === 'mr' ? 'कोणतीही शीतगृहे आढळली नाहीत' : currentLanguage === 'hi' ? 'कोई शीतगृह नहीं मिला' : 'No storage facilities found.')}
          </p>
          <p className="text-[#064E3B]/60">
            {cropFacilities.length === 0
              ? (currentLanguage === 'mr'
                ? `${activeFarmer.primaryCrop} पिकासाठी कोणतेही साठवणूक केंद्र उपलब्ध नाही.`
                : currentLanguage === 'hi'
                ? `${activeFarmer.primaryCrop} फसल के लिए कोई भंडारण सुविधा उपलब्ध नहीं है।`
                : `No storage facilities found suitable for ${activeFarmer.primaryCrop}.`)
              : (currentLanguage === 'mr'
                ? 'कृपया आपले शोध निकष किंवा कमाल भाडे बदला.'
                : currentLanguage === 'hi'
                ? 'कृपया अपने फ़िल्टर या अधिकतम किराया समायोजित करें।'
                : 'Try adjusting your district or rate filters.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFacilities.map((facility) => (
          <div
            key={facility.id}
            className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#064E3B] transition-colors"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#064E3B] leading-snug">
                    {facility.name}
                  </h3>
                  <p className="text-xs text-[#064E3B]/70 mt-1 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#064E3B]/60 shrink-0" />
                    <span>{facility.location}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-bold text-[#064E3B] block">
                    {formatINR(facility.ratePerQuintalMonth)}
                  </span>
                  <span className="text-[10px] text-[#064E3B]/60 block">{currentLanguage === 'mr' ? 'प्रति क्विंटल / महिना' : currentLanguage === 'hi' ? 'प्रति क्विंटल / माह' : 'per Qtl / Month'}</span>
                </div>
              </div>

              {/* Specs & Capacity */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8E7C9]/40 rounded-xl border border-[#E0C79B]/60 text-xs">
                <div>
                  <span className="text-[#064E3B]/60 block text-[10px]">{t('distance', 'Distance')}</span>
                  <span className="font-bold text-[#064E3B]">~{facility.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-[#064E3B]/60 block text-[10px]">{t('freeSpace', 'Free Space')}</span>
                  <span className="font-bold text-[#064E3B]">
                    {facility.availableCapacityMT.toLocaleString()} MT
                  </span>
                </div>
                <div>
                  <span className="text-[#064E3B]/60 block text-[10px]">{t('handlingFee', 'In-Out Handling')}</span>
                  <span className="font-bold text-[#064E3B]">
                    {formatINR(facility.handlingCostPerQuintal)}/Qtl
                  </span>
                </div>
              </div>

              {/* Features Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[#064E3B]/70 block">
                  {t('featuresAndControls', 'Features & Quality Controls')}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {facility.features.map((feat, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-2 py-0.5 rounded-md font-medium"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Atmospheric Controls */}
              <div className="text-[11px] text-[#064E3B]/70 space-y-0.5 pt-1">
                <div>
                  <strong>{currentLanguage === 'mr' ? 'वातावरण नियंत्रण:' : currentLanguage === 'hi' ? 'वातावरण नियंत्रण:' : 'Atmosphere:'}</strong> {facility.temperatureRange} • {facility.humidityRange}
                </div>
                <div>
                  <strong>{currentLanguage === 'mr' ? 'उपयुक्त पिके:' : currentLanguage === 'hi' ? 'उपयुक्त फसलें:' : 'Suitable Crops:'}</strong> {facility.suitableCrops.join(', ')}
                </div>
              </div>
            </div>

            {/* Action Bar with "Get Directions" and "Send Storage Enquiry" */}
            <div className="pt-4 border-t border-[#E0C79B]/50 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[#064E3B]">
                <span className="text-[#064E3B]/60 block text-[10px]">{currentLanguage === 'mr' ? 'संपर्क अधिकारी:' : currentLanguage === 'hi' ? 'संपर्क अधिकारी:' : 'Contact:'}</span>
                <span className="font-semibold text-[#064E3B]">{facility.contactPerson}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* GET DIRECTIONS BUTTON */}
                <button
                  type="button"
                  onClick={() => handleOpenGoogleMapsDirections(facility)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8E7C9]/60 text-[#064E3B] text-xs font-semibold hover:bg-[#F8E7C9] border border-[#E0C79B] transition-colors shadow-2xs"
                  title="Open directions in Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#064E3B]" />
                  <span>{t('getDirections', 'Get Directions')}</span>
                  <ExternalLink className="w-3 h-3 text-[#064E3B]/60" />
                </button>

                {/* SEND STORAGE ENQUIRY BUTTON */}
                <button
                  type="button"
                  onClick={() => setActiveFacilityForEnquiry(facility)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#064E3B] text-[#F8E7C9] text-xs font-semibold hover:bg-[#043D2E] shadow-2xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'mr' ? 'साठवणूक चौकशी पाठवा' : currentLanguage === 'hi' ? 'भंडारण पूछताछ भेजें' : 'Send Storage Enquiry'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Action Notification Banner */}
      {actionSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-emerald-200 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* My Storage Appointments Section */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0C79B]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#F8E7C9] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#064E3B] leading-tight">
                {currentLanguage === 'mr'
                  ? `माझ्या साठवणूक भेटी (My Storage Appointments - ${farmerAppointments.length})`
                  : currentLanguage === 'hi'
                  ? `मेरी भंडारण अपॉइंटमेंट्स (My Storage Appointments - ${farmerAppointments.length})`
                  : `My Storage Appointments (${farmerAppointments.length})`}
              </h3>
              <p className="text-xs text-[#064E3B]/70 mt-0.5">
                Track live approval, confirmed schedule, rejection reasons, and suggested alternative timings from cold storage facility owners.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshAppointments}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E0C79B] text-xs font-semibold text-[#064E3B] hover:bg-[#F8E7C9] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {farmerAppointments.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#E0C79B] rounded-xl space-y-2 text-[#064E3B]/70">
            <Building2 className="w-10 h-10 mx-auto text-[#064E3B]/40" />
            <p className="text-xs font-semibold">No storage appointments booked yet.</p>
            <p className="text-[11px]">Select any accredited cold storage facility above and click <strong>&quot;Send Storage Enquiry&quot;</strong> to book an appointment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {farmerAppointments.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-white border border-[#E0C79B] shadow-2xs space-y-3 transition-all hover:border-[#064E3B]"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#064E3B]">{app.facilityName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">ID: {app.id}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Requested: <strong>{app.quantityQuintals} Quintals</strong> of <strong>{app.crop}</strong>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {app.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Pending Owner Approval</span>
                      </span>
                    )}
                    {app.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Approved & Confirmed</span>
                      </span>
                    )}
                    {app.status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rejected by Facility</span>
                      </span>
                    )}
                    {app.status === 'Reschedule Requested' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
                        <span>Reschedule Requested</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Schedule Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Requested Intake Slot:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {app.preferredDate} at {app.preferredTime}
                    </span>
                  </div>

                  {app.status === 'Approved' && (
                    <div>
                      <span className="text-emerald-700 block text-[11px] font-bold">Confirmed Storage Intake:</span>
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {app.confirmedDate || app.preferredDate} at {app.confirmedTime || app.preferredTime}
                      </span>
                    </div>
                  )}

                  {app.additionalDetails && (
                    <div className="sm:col-span-2 text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                      <strong>Notes:</strong> {app.additionalDetails}
                    </div>
                  )}
                </div>

                {/* Rejection Reason Box */}
                {app.status === 'Rejected' && (
                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-1">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Rejection Reason from Owner:
                    </span>
                    <p className="text-rose-800 italic pl-5">
                      &quot;{app.rejectionReason || 'No specific reason provided by facility manager.'}&quot;
                    </p>
                  </div>
                )}

                {/* Reschedule Negotiation Box */}
                {app.status === 'Reschedule Requested' && (
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-3">
                    <div className="flex items-start gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-900 block">
                          Facility Owner has Proposed an Alternative Schedule:
                        </span>
                        <div className="mt-1 font-bold text-blue-950 text-sm flex items-center gap-2">
                          <span>{app.proposedAlternativeDate || app.preferredDate}</span>
                          <span>•</span>
                          <span>{app.proposedAlternativeTime || app.preferredTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleAcceptAlternative(app.id)}
                        className="px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-bold hover:bg-[#08634B] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Proposed Time</span>
                      </button>

                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleOpenCounterModal(app)}
                        className="px-4 py-2 rounded-xl bg-white border border-blue-300 text-blue-900 text-xs font-bold hover:bg-blue-100/50 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-700" />
                        <span>Request Another Date / Time</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Enquiry Modal */}
      {activeFacilityForEnquiry && (
        <NewEnquiryModal
          isOpen={!!activeFacilityForEnquiry}
          onClose={() => setActiveFacilityForEnquiry(null)}
          facility={activeFacilityForEnquiry}
        />
      )}

      {/* Farmer Counter-Proposal Modal */}
      {counterModalApp && (
        <Modal
          isOpen={!!counterModalApp}
          onClose={() => setCounterModalApp(null)}
          title="Request Another Date & Time"
          subtitle={counterModalApp.facilityName}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitCounterProposal} className="space-y-4 text-xs">
            <p className="text-slate-600">
              The facility manager proposed <strong>{counterModalApp.proposedAlternativeDate} at {counterModalApp.proposedAlternativeTime}</strong>.
              If this does not suit your harvest or transport schedule, specify your preferred alternative date and time below.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Your Preferred New Date: *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  required
                  value={counterDate}
                  onChange={(e) => setCounterDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Your Preferred New Time: *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 02:00 PM"
                  value={counterTime}
                  onChange={(e) => setCounterTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Note for Facility Manager (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Transport truck arrives only in the afternoon..."
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCounterModalApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-xl bg-[#064E3B] text-white text-xs font-bold hover:bg-[#043D2E] shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Counter Request</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
