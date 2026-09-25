import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ColdStorageFacility } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Calendar, Clock, Layers, FileText, Send, Sparkles, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface NewEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: ColdStorageFacility;
}

const COMMON_TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '01:30 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
];

export const NewEnquiryModal: React.FC<NewEnquiryModalProps> = ({
  isOpen,
  onClose,
  facility,
}) => {
  const { activeFarmer, createStorageAppointment, currentLanguage } = useApp();

  const [crop, setCrop] = useState<string>(activeFarmer.primaryCrop || 'Onion');
  const [quantity, setQuantity] = useState<number>(activeFarmer.expectedHarvestQuintals || 150);
  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState<string>('10:30 AM');
  const [additionalDetails, setAdditionalDetails] = useState<string>(
    'Requesting intake grading and CIPC anti-sprouting treatment.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const estimatedMonthlyRent = Number(quantity || 0) * facility.ratePerQuintalMonth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop || !quantity || !preferredDate || !preferredTime) {
      setErrorMessage('Please fill in all mandatory appointment fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createStorageAppointment({
        farmerId: activeFarmer.id,
        farmerName: activeFarmer.name,
        farmerPhone: activeFarmer.phone,
        facilityId: facility.id,
        facilityName: facility.name,
        crop,
        quantityQuintals: Number(quantity),
        preferredDate,
        preferredTime,
        additionalDetails: additionalDetails.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit appointment request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setErrorMessage(null);
    onClose();
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={
        isSubmitted
          ? currentLanguage === 'mr'
            ? 'साठवणूक भेट विनंती यशस्वीरित्या पाठवली'
            : currentLanguage === 'hi'
            ? 'भंडारण अपॉइंटमेंट अनुरोध सफलतापूर्वक भेजा गया'
            : 'Appointment Request Submitted'
          : currentLanguage === 'mr'
          ? 'शीतगृह साठवणूक भेट विनंती (Send Storage Enquiry)'
          : currentLanguage === 'hi'
          ? 'शीतगृह भंडारण अपॉइंटमेंट अनुरोध (Send Storage Enquiry)'
          : 'Cold Storage Appointment Request'
      }
      subtitle={facility.name}
      maxWidth="lg"
    >
      {isSubmitted ? (
        <div className="space-y-4 text-center py-4 animate-fade-in">
          <div className="w-14 h-14 bg-emerald-100 text-[#064E3B] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-700" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Status: Pending Owner Approval</span>
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {currentLanguage === 'mr'
                ? 'आपली साठवणूक विनंती व्यवस्थापकाकडे पाठवली आहे'
                : currentLanguage === 'hi'
                ? 'आपका भंडारण अनुरोध व्यवस्थापक के पास भेजा गया है'
                : 'Your Appointment Request is Submitted!'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
              {currentLanguage === 'mr'
                ? `${facility.name} कडे ${quantity} क्विंटल ${crop} साठवणुकीसाठी ${preferredDate} रोजी ${preferredTime} ची भेट विनंती नोंदवली गेली आहे.`
                : currentLanguage === 'hi'
                ? `${facility.name} के लिए ${quantity} क्विंटल ${crop} भंडारण हेतु ${preferredDate} को ${preferredTime} का अपॉइंटमेंट अनुरोध दर्ज हो गया है।`
                : `Your appointment request for ${quantity} Qtl of ${crop} at ${facility.name} on ${preferredDate} at ${preferredTime} has been submitted.`}
            </p>
          </div>

          {/* Appointment Summary Box */}
          <div className="bg-[#FFFDF7] border border-[#E0C79B] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto shadow-2xs">
            <div className="flex justify-between border-b border-[#E0C79B]/50 pb-2">
              <span className="text-slate-500">Facility:</span>
              <span className="font-bold text-[#064E3B] text-right truncate max-w-[200px]">{facility.name}</span>
            </div>
            <div className="flex justify-between border-b border-[#E0C79B]/50 pb-2">
              <span className="text-slate-500">Crop & Quantity:</span>
              <span className="font-bold text-slate-800">{crop} • {quantity} Quintals</span>
            </div>
            <div className="flex justify-between border-b border-[#E0C79B]/50 pb-2">
              <span className="text-slate-500">Preferred Date & Time:</span>
              <span className="font-bold text-[#064E3B]">{preferredDate} at {preferredTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Indicative Monthly Rent:</span>
              <span className="font-bold text-[#064E3B]">{formatINR(estimatedMonthlyRent)}/month</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            You can track the owner&apos;s live response, approval status, or proposed alternative schedule under{' '}
            <strong>My Storage Appointments</strong> on the Cold Storage page.
          </p>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#064E3B] text-[#F8E7C9] text-xs font-bold hover:bg-[#043D2E] shadow-sm transition-colors cursor-pointer"
          >
            Done & View My Appointments
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Facility snapshot banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8E7C9]/40 border border-[#E0C79B] text-xs">
            <div>
              <span className="text-[#064E3B]/70 block text-[10px] font-semibold uppercase tracking-wider">Facility Rate:</span>
              <span className="font-bold text-sm text-[#064E3B]">{formatINR(facility.ratePerQuintalMonth)}/Qtl/month</span>
            </div>
            <div className="text-right">
              <span className="text-[#064E3B]/70 block text-[10px] font-semibold uppercase tracking-wider">Available Capacity:</span>
              <span className="font-bold text-xs text-[#064E3B]">{facility.availableCapacityMT.toLocaleString()} MT Free</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5 text-xs">
            {/* 1. Crop Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>1. Crop Name (पीक नाव): *</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Farmer primary crop prefilled</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from(new Set([activeFarmer.primaryCrop, ...(facility.suitableCrops || [])])).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCrop(c)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      crop.toLowerCase() === c.toLowerCase()
                        ? 'bg-emerald-50 border-[#064E3B] text-[#064E3B] ring-1 ring-[#064E3B]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Quantity to Store */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Quantity to Store (साठवणूक प्रमाण - क्विंटल): *</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="e.g. 150"
                  className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  Quintals
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Estimated Monthly Warehouse Rent: <strong>{formatINR(estimatedMonthlyRent)}</strong> / month
              </p>
            </div>

            {/* 3. Preferred Appointment Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>3. Preferred Date (भेट तारीख): *</span>
                </label>
                <input
                  type="date"
                  min={minDate}
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preferred Time Slot (वेळ): *</span>
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                >
                  {COMMON_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Additional Details (Optional) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>4. Additional Details (अतिरिक्त माहिती / सूचना - पर्यायी):</span>
              </label>
              <textarea
                rows={2}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="e.g. Need vehicle unloading support, crate storage, expected storage duration (e.g. 3 months)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#064E3B] text-[#F8E7C9] text-xs font-bold hover:bg-[#043D2E] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Storage Enquiry'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
