import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MonitoringEngine } from '../../services/monitoringEngine';
import { FarmerMonitoringProfile, MandiPriceRecord } from '../../types';
import {
  Sprout,
  MapPin,
  Building2,
  PhoneCall,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Save,
  Layers,
} from 'lucide-react';

const AVAILABLE_CROPS = [
  { id: 'Soybean', name: 'Soybean (सोयाबीन)', icon: '🌱', defaultMandi: 'Rahata APMC' },
  { id: 'Cotton', name: 'Cotton (कापूस)', icon: '☁️', defaultMandi: 'Akkalkot APMC' },
  { id: 'Tur', name: 'Tur / Arhar (तूर)', icon: '🌾', defaultMandi: 'Latur APMC Dal Market' },
  { id: 'Onion', name: 'Onion (कांदा)', icon: '🧅', defaultMandi: 'Lasalgaon APMC' },
  { id: 'Jowar', name: 'Jowar (ज्वारी)', icon: '🌽', defaultMandi: 'Solapur APMC Grain Market' },
];

export const CropMonitoringManager: React.FC = () => {
  const { activeFarmer, mandis } = useApp();

  const [profile, setProfile] = useState<FarmerMonitoringProfile>(() =>
    MonitoringEngine.getMonitoringProfile(activeFarmer)
  );
  const [isSaved, setIsSaved] = useState(false);

  // Sync when active farmer changes
  useEffect(() => {
    setProfile(MonitoringEngine.getMonitoringProfile(activeFarmer));
  }, [activeFarmer]);

  const toggleCrop = (cropId: string) => {
    setProfile((prev) => {
      const exists = prev.selectedCrops.includes(cropId);
      const nextCrops = exists
        ? prev.selectedCrops.filter((c) => c !== cropId)
        : [...prev.selectedCrops, cropId];

      // Ensure at least 1 crop is selected
      if (nextCrops.length === 0) return prev;
      return { ...prev, selectedCrops: nextCrops };
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    const updated = {
      ...profile,
      lastEvaluatedAt: new Date().toISOString(),
    };
    MonitoringEngine.saveMonitoringProfile(updated);
    setProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const isCooldownActive = !!profile.cooldownUntil && new Date(profile.cooldownUntil) > new Date();

  return (
    <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0C79B]/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#F8E7C9] flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#064E3B] leading-tight">
              Crop Advisory & Monitoring Profile (पीक निवड व देखरेख)
            </h3>
            <p className="text-xs text-[#064E3B]/70 mt-0.5">
              Select crops and mandis for automated price tracking and AI voice trigger calls.
            </p>
          </div>
        </div>

        {/* Cooldown / Active Status Badge */}
        <div className="flex items-center gap-2">
          {isCooldownActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Calls Paused (Farmer Responded)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#064E3B]/10 border border-[#064E3B]/20 text-[#064E3B] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#064E3B]" />
              <span>Monitoring Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Step 2: Farmer Selects Crop(s) */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
          <span>1. Select Crop(s) to Monitor (पीक निवडा):</span>
          <span className="text-[11px] text-slate-400 font-normal">Multi-crop tracking enabled</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {AVAILABLE_CROPS.map((crop) => {
            const isSelected = profile.selectedCrops.includes(crop.id);
            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => toggleCrop(crop.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{crop.icon}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold leading-tight">{crop.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{crop.defaultMandi}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2b: District, Taluka & Preferred Mandi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            District (जिल्हा):
          </label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={profile.district}
              onChange={(e) => {
                setProfile({ ...profile, district: e.target.value });
                setIsSaved(false);
              }}
              placeholder="e.g. Nashik"
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Taluka (तालुका):
          </label>
          <input
            type="text"
            value={profile.taluka}
            onChange={(e) => {
              setProfile({ ...profile, taluka: e.target.value });
              setIsSaved(false);
            }}
            placeholder="e.g. Niphad"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Preferred Mandi (पर्यायी बाजार समिती):
          </label>
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={profile.preferredMandi || ''}
              onChange={(e) => {
                setProfile({ ...profile, preferredMandi: e.target.value || undefined });
                setIsSaved(false);
              }}
              className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">Auto-select nearest APMC</option>
              {mandis.map((m) => (
                <option key={m.id} value={m.market}>
                  {m.market} ({m.commodity} - ₹{m.modalPrice}/Qtl)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2c: Preferred Channel (In-App / IVR / WhatsApp) */}
      <div className="pt-1">
        <label className="block text-xs font-bold text-[#064E3B] mb-1.5">
          2. Preferred Alert & Call Channel (सूचना व कॉल माध्यम):
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setProfile({ ...profile, channelPreference: 'ivr' });
              setIsSaved(false);
            }}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
              profile.channelPreference === 'ivr'
                ? 'bg-[#064E3B] text-[#F8E7C9] border-[#064E3B] shadow-xs'
                : 'bg-[#F8E7C9]/30 border-[#E0C79B] text-[#064E3B] hover:bg-[#F8E7C9]/50'
            }`}
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">AI Voice Call (IVR)</div>
              <div className="text-[10px] opacity-80">फोन कॉल व कीपॅड प्रतिसाद</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setProfile({ ...profile, channelPreference: 'whatsapp' });
              setIsSaved(false);
            }}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
              profile.channelPreference === 'whatsapp'
                ? 'bg-[#064E3B] text-[#F8E7C9] border-[#064E3B] shadow-xs'
                : 'bg-[#F8E7C9]/30 border-[#E0C79B] text-[#064E3B] hover:bg-[#F8E7C9]/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">WhatsApp Advisory</div>
              <div className="text-[10px] opacity-80">व्हॉट्सअॅप मेसेज व दर</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setProfile({ ...profile, channelPreference: 'app' });
              setIsSaved(false);
            }}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
              profile.channelPreference === 'app'
                ? 'bg-[#064E3B] text-[#F8E7C9] border-[#064E3B] shadow-xs'
                : 'bg-[#F8E7C9]/30 border-[#E0C79B] text-[#064E3B] hover:bg-[#F8E7C9]/50'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">In-App Dashboard</div>
              <div className="text-[10px] opacity-80">अ‍ॅप व एसएमएस सूचना</div>
            </div>
          </button>
        </div>
      </div>

      {/* Save Action & Notification */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E0C79B]/50">
        <div className="text-xs text-[#064E3B]/70">
          {profile.lastFarmerDecision && (
            <span>
              Last Action:{' '}
              <strong className="text-[#064E3B]">
                {profile.lastFarmerDecision === 'SELL_NOW'
                  ? 'Sell Now (Key 1)'
                  : profile.lastFarmerDecision === 'STORE'
                  ? 'Store (Key 2)'
                  : 'Follow-up (Key 3)'}
              </strong>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] hover:bg-[#043D2E] text-[#F8E7C9] font-bold text-xs shadow transition-all cursor-pointer"
        >
          {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-[#F8E7C9]" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'Monitoring Profile Saved!' : 'Save Monitoring Profile'}</span>
        </button>
      </div>
    </div>
  );
};
