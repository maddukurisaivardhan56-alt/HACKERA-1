import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AdvisoryRecord, Language, FarmerSupportRequest, DtmfResponseCode } from '../../types';
import { INITIAL_SUPPORT_REQUESTS } from '../../data/initialOfficerData';
import { TelephonyService, SimulatedCallStep } from '../../services/telephonyService';
import { MonitoringEngine } from '../../services/monitoringEngine';
import {
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  Radio,
  CheckCircle,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';
import { maskPhoneNumber } from '../../utils/formatters';

interface SimulatedCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisory: AdvisoryRecord;
  farmerPhone?: string;
}

export const SimulatedCallModal: React.FC<SimulatedCallModalProps> = ({
  isOpen,
  onClose,
  advisory,
  farmerPhone = '9822012345',
}) => {
  const [step, setStep] = useState<SimulatedCallStep>('idle');
  const [selectedLang, setSelectedLang] = useState<Language>('mr');
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callSid] = useState<string>(() => TelephonyService.generateDemoCallSid());

  // DTMF Interactive Keypad State
  const [activeDtmf, setActiveDtmf] = useState<DtmfResponseCode | null>(
    (advisory.farmerDtmfResponse as DtmfResponseCode) || null
  );
  const [dtmfFeedback, setDtmfFeedback] = useState<string | null>(null);
  const [cooldownNotice, setCooldownNotice] = useState<string | null>(null);

  const handleDtmfPress = (key: DtmfResponseCode) => {
    setActiveDtmf(key);
    advisory.farmerDtmfResponse = key;

    const res = MonitoringEngine.recordDtmfResponse({
      farmerId: advisory.farmerId,
      advisoryId: advisory.id,
      key,
    });

    fetch('/api/telephony/record-dtmf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: advisory.farmerId,
        advisoryId: advisory.id,
        key,
      }),
    }).catch(() => {});

    const voiceMsg =
      selectedLang === 'mr'
        ? res.confirmationMessage.mr
        : selectedLang === 'hi'
        ? res.confirmationMessage.hi
        : selectedLang === 'te'
        ? res.confirmationMessage.te
        : res.confirmationMessage.en;

    setDtmfFeedback(voiceMsg);
    setCooldownNotice(
      key === '3'
        ? 'Reminder scheduled: System will follow up with updated prices in 3 days.'
        : `Decision recorded: Will ${key === '1' ? 'Sell Now' : 'Store in Cold Storage'}. Advisory trigger calls paused for 7 days.`
    );
    TelephonyService.speakText(voiceMsg, selectedLang);
  };

  // Call Appointment Booking State
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:30 AM');
  const [agreedStatus, setAgreedStatus] = useState<'agreed' | 'pending'>('pending');
  const [createdComplaintId, setCreatedComplaintId] = useState<string | null>(null);

  const handleCreateComplaintFromCall = () => {
    const newId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const isAgreed = agreedStatus === 'agreed' && preferredDate;
    
    const newReq: FarmerSupportRequest = {
      id: newId,
      farmerId: advisory.farmerId,
      farmerName: advisory.farmerName,
      phone: farmerPhone,
      village: 'Lasalgaon',
      crop: advisory.crop,
      subject: `AI Call Follow-up: Field Visit for ${advisory.crop}`,
      issueCategory: 'Cultivation Practice',
      description: `Initiated during automated voice call advisory (${advisory.id}). Farmer requested Agriculture Officer inspection on-site regarding: ${advisory.triggerEvent}.`,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Open',
      priority: 'High',
      appointmentStatus: isAgreed ? 'Visit Scheduled' : 'Appointment Pending',
      appointmentDate: isAgreed ? preferredDate : undefined,
      appointmentTime: isAgreed ? preferredTime : undefined,
    };

    try {
      const saved = localStorage.getItem('fg_officer_support_requests');
      const list: FarmerSupportRequest[] = saved ? JSON.parse(saved) : [...INITIAL_SUPPORT_REQUESTS];
      localStorage.setItem('fg_officer_support_requests', JSON.stringify([newReq, ...list]));
      window.dispatchEvent(new Event('fg_support_updated'));
      setCreatedComplaintId(newId);
    } catch {}
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopSpeechFn: (() => void) | null = null;

    if (isOpen) {
      setStep('initiating');
      setSecondsElapsed(0);

      // Transition 1: Initiating -> Ringing (1.2s)
      const t1 = setTimeout(() => {
        setStep('ringing');

        // Transition 2: Ringing -> Connected (2.5s)
        const t2 = setTimeout(() => {
          setStep('connected');

          // Transition 3: Speaking Voice Advisory
          const script = TelephonyService.getLanguageScript(advisory, selectedLang);
          stopSpeechFn = TelephonyService.speakText(script, selectedLang, () => {
            setStep('completed');
          });

          // Call timer
          timer = setInterval(() => {
            setSecondsElapsed((prev) => {
              if (prev >= 25) {
                setStep('completed');
                return prev;
              }
              return prev + 1;
            });
          }, 1000);
        }, 2200);

        return () => clearTimeout(t2);
      }, 1200);

      return () => {
        clearTimeout(t1);
        clearInterval(timer);
        if (stopSpeechFn) stopSpeechFn();
        TelephonyService.stopSpeaking();
      };
    } else {
      setStep('idle');
      TelephonyService.stopSpeaking();
    }
  }, [isOpen, advisory, selectedLang]);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLang(lang);
    if (step === 'connected' || step === 'speaking') {
      TelephonyService.stopSpeaking();
      const script = TelephonyService.getLanguageScript(advisory, lang);
      TelephonyService.speakText(script, lang, () => {
        setStep('completed');
      });
    }
  };

  const handleEndCall = () => {
    TelephonyService.stopSpeaking();
    setStep('completed');
  };

  const currentScript = TelephonyService.getLanguageScript(advisory, selectedLang);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        TelephonyService.stopSpeaking();
        onClose();
      }}
      title="Automated Voice Advisory — Call Simulator"
      subtitle="Exotel IVR Telephony Gateway Simulation"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Prototype Transparency Notice */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>SIMULATED CALL:</strong> No actual phone call is placed. This simulates automated voice advisory delivery.
          </span>
        </div>

        {/* Telephony Status Screen */}
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-inner flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center justify-between w-full text-[11px] text-slate-400 border-b border-slate-800 pb-2">
            <span>SID: {callSid}</span>
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Carrier: MH-Telecom-Sim</span>
            </span>
          </div>

          {/* Caller Animation / State */}
          <div className="relative my-2">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                step === 'connected' || step === 'speaking'
                  ? 'bg-emerald-600 text-white ring-8 ring-emerald-500/20'
                  : step === 'ringing'
                  ? 'bg-amber-600 text-white ring-8 ring-amber-500/20 animate-pulse'
                  : step === 'completed'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {step === 'completed' ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <PhoneCall className="w-8 h-8" />
              )}
            </div>
          </div>

          <div>
            <div className="text-lg font-bold text-white tracking-wide">
              {advisory.farmerName}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {maskPhoneNumber(farmerPhone)}
            </div>
          </div>

          {/* Status Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold">
            {step === 'initiating' && <span className="text-slate-300">Initiating Gateway Dispatch...</span>}
            {step === 'ringing' && <span className="text-amber-300 animate-pulse">Ringing Handset...</span>}
            {step === 'connected' && (
              <span className="text-emerald-400">
                Connected ({String(Math.floor(secondsElapsed / 60)).padStart(2, '0')}:
                {String(secondsElapsed % 60).padStart(2, '0')})
              </span>
            )}
            {step === 'completed' && <span className="text-slate-400">Call Completed & Logged</span>}
          </div>

          {/* Spoken Wave Animation if speaking */}
          {step === 'connected' && (
            <div className="flex items-center gap-1 h-6 py-1">
              {[40, 75, 100, 60, 90, 45, 80, 50, 70, 95, 30].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Audio Script Transcript */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Speech Synthesis Script (AI Advisory)
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleLanguageChange('mr')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  selectedLang === 'mr' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी (Marathi)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('hi')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  selectedLang === 'hi' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('te')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  selectedLang === 'te' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                తెలుగు (Telugu)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  selectedLang === 'en' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200/60 shadow-2xs">
            "{currentScript}"
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
            <div>
              <span className="font-semibold text-slate-700">Trigger: </span>
              {advisory.triggerEvent}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Recommended Action: </span>
              <span className="text-emerald-800 font-semibold">{advisory.keyInsights.recommendedAction}</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE TELEPHONY DTMF KEYPAD (Farmer Response Capture) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                #
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>Telephony DTMF Keypad (Farmer Response)</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded text-[9px]">Live IVR</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  During or after the call, farmer presses keys on phone dialer to record action:
                </p>
              </div>
            </div>

            {activeDtmf && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Key [{activeDtmf}] Pressed
              </span>
            )}
          </div>

          {/* 3 DTMF Key Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Key 1 */}
            <button
              type="button"
              onClick={() => handleDtmfPress('1')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeDtmf === '1'
                  ? 'bg-emerald-700/80 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-lg'
                  : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-6 h-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-[10px] font-medium opacity-70">Sell Now</span>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">“1” = I will sell now</div>
                <div className="text-[10px] opacity-75 mt-0.5">त्वरित विक्री करणार (Sell Now)</div>
              </div>
            </button>

            {/* Key 2 */}
            <button
              type="button"
              onClick={() => handleDtmfPress('2')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeDtmf === '2'
                  ? 'bg-emerald-700/80 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-lg'
                  : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-6 h-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-[10px] font-medium opacity-70">Hold & Store</span>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">“2” = I will store</div>
                <div className="text-[10px] opacity-75 mt-0.5">शीतगृहात साठवणार (Store)</div>
              </div>
            </button>

            {/* Key 3 */}
            <button
              type="button"
              onClick={() => handleDtmfPress('3')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeDtmf === '3'
                  ? 'bg-amber-700/80 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-lg'
                  : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-6 h-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-[10px] font-medium opacity-70">Follow Up</span>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">“3” = Call again in a few days</div>
                <div className="text-[10px] opacity-75 mt-0.5">पुन्हा फोन करा (Call Again)</div>
              </div>
            </button>
          </div>

          {/* DTMF Feedback & Cooldown Notification */}
          {dtmfFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-emerald-200 text-[11px] space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>IVR System Audio Confirmation:</span>
              </div>
              <p className="italic text-slate-200 leading-snug">"{dtmfFeedback}"</p>
              {cooldownNotice && (
                <div className="pt-1 text-[10px] text-amber-300 flex items-center gap-1 border-t border-emerald-800/40">
                  <span>⏱</span>
                  <span>{cooldownNotice}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Call Follow-up & Agriculture Officer Visit Booking */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#064E3B]">
              <ClipboardList className="w-4 h-4 text-[#064E3B]" />
              <span>Agriculture Officer Farm Visit (AI Call Flow)</span>
            </div>
            {!createdComplaintId && (
              <button
                type="button"
                onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                {showAppointmentForm ? 'Hide Booking' : 'Schedule Visit / Raise Complaint'}
              </button>
            )}
          </div>

          {createdComplaintId ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1 text-emerald-800 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Complaint Created Successfully: <span className="font-mono">{createdComplaintId}</span></span>
              </div>
              <p className="text-emerald-900 text-[11px]">
                Status: <strong>{agreedStatus === 'agreed' ? `Visit Scheduled for ${preferredDate} at ${preferredTime}` : 'Appointment Pending'}</strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                Logged in Agriculture Officer portal under <strong>Farmer Support</strong>.
              </p>
            </div>
          ) : showAppointmentForm ? (
            <div className="space-y-3 pt-1 text-xs">
              <p className="text-slate-600 text-[11px] leading-relaxed">
                During the AI call, ask the farmer if they would like an on-site visit by the Agriculture Officer.
              </p>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-medium">
                  <input
                    type="radio"
                    name="agreedStatus"
                    value="agreed"
                    checked={agreedStatus === 'agreed'}
                    onChange={() => setAgreedStatus('agreed')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Farmer Agreed on Date & Time</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-medium">
                  <input
                    type="radio"
                    name="agreedStatus"
                    value="agreed"
                    checked={agreedStatus === 'pending'}
                    onChange={() => setAgreedStatus('pending')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Appointment Pending (No Date Fixed)</span>
                </label>
              </div>

              {agreedStatus === 'agreed' && (
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Agreed Visit Date:
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Agreed Visit Time:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              )}

              {agreedStatus === 'pending' && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                  📌 Notice: Officer portal will clearly show <strong>Appointment Pending</strong>. No random date/time is assigned.
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateComplaintFromCall}
                disabled={agreedStatus === 'agreed' && !preferredDate}
                className="w-full py-2 bg-[#064E3B] text-[#F8E7C9] font-semibold rounded-lg hover:bg-[#043D2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log Complaint & Save Appointment
              </button>
            </div>
          ) : null}
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (isMuted) {
                TelephonyService.speakText(currentScript, selectedLang);
                setIsMuted(false);
              } else {
                TelephonyService.stopSpeaking();
                setIsMuted(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute TTS Audio'}</span>
          </button>

          {step !== 'completed' ? (
            <button
              type="button"
              onClick={handleEndCall}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-xs"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Disconnect Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                TelephonyService.stopSpeaking();
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#064E3B] text-[#F8E7C9] font-semibold text-xs hover:bg-[#043D2E] shadow-xs"
            >
              <span>Close Call Window</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
