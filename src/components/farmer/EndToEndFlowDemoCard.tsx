import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MonitoringEngine } from '../../services/monitoringEngine';
import { AdvisoryRecord, TriggerEvaluationResult } from '../../types';
import { SimulatedCallModal } from '../advisory/SimulatedCallModal';
import {
  Sparkles,
  PhoneCall,
  Activity,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Zap,
  Check,
} from 'lucide-react';

export const EndToEndFlowDemoCard: React.FC = () => {
  const { activeFarmer, mandis, storageFacilities, addAdvisoryRecord } = useApp();

  // Selected crop for live monitoring evaluation
  const [selectedCrop, setSelectedCrop] = useState<string>('Onion');

  // Simulation overrides (allows testing triggers live)
  const [simulationMode, setSimulationMode] = useState<
    'normal' | 'price_drop' | 'price_rise' | 'storage_favorable'
  >('normal');

  // Active call modal
  const [activeCallAdvisory, setActiveCallAdvisory] = useState<AdvisoryRecord | null>(null);

  // Profile
  const profile = useMemo(
    () => MonitoringEngine.getMonitoringProfile(activeFarmer),
    [activeFarmer]
  );

  // Matched Mandi & Storage Facility
  const matchedMandi = useMemo(() => {
    const direct = mandis.find(
      (m) => m.commodity.toLowerCase() === selectedCrop.toLowerCase()
    );
    return (
      direct ||
      mandis[0] || {
        id: 'mandi-mock',
        commodity: selectedCrop,
        state: 'Maharashtra',
        district: 'Nashik',
        market: `${selectedCrop} Primary Mandi`,
        minPrice: 2200,
        maxPrice: 2800,
        modalPrice: 2500,
        unit: 'Quintal',
        arrivalQuantityQuintals: 3000,
        variety: 'Standard',
        grade: 'FAQ',
        source: 'Agmarknet Feed',
        reportedDate: new Date().toISOString().split('T')[0],
      }
    );
  }, [mandis, selectedCrop]);

  const matchedStorage = storageFacilities[0];

  // Price overrides for live trigger testing
  const sevenDayAvg = useMemo(
    () => MonitoringEngine.getSevenDayAveragePrice(selectedCrop, matchedMandi.modalPrice),
    [selectedCrop, matchedMandi]
  );

  const currentPrice = useMemo(() => {
    if (simulationMode === 'price_drop') {
      // 14% below 7-day average (triggers price drop)
      return Math.round(sevenDayAvg * 0.86);
    }
    if (simulationMode === 'price_rise') {
      // 15% above 7-day average (triggers price surge)
      return Math.round(sevenDayAvg * 1.15);
    }
    if (simulationMode === 'storage_favorable') {
      // Mild price dip with high future projection
      return Math.round(sevenDayAvg * 0.94);
    }
    return matchedMandi.modalPrice;
  }, [simulationMode, sevenDayAvg, matchedMandi]);

  const futurePriceOverride = useMemo(() => {
    if (simulationMode === 'storage_favorable') {
      return Math.round(currentPrice * 1.35); // 35% higher in future
    }
    return undefined;
  }, [simulationMode, currentPrice]);

  // Run Trigger Engine Evaluation
  const evalResult: TriggerEvaluationResult = useMemo(() => {
    return MonitoringEngine.evaluateCropTriggers({
      farmer: activeFarmer,
      profile,
      crop: selectedCrop,
      mandi: matchedMandi,
      storageFacility: matchedStorage,
      overridePrice: currentPrice,
      overrideExpectedFuturePrice: futurePriceOverride,
    });
  }, [activeFarmer, profile, selectedCrop, matchedMandi, matchedStorage, currentPrice, futurePriceOverride]);

  // Handle Trigger Dispatch to Voice Call
  const handleLaunchCall = () => {
    const advisory = MonitoringEngine.createAdvisoryFromEvaluation({
      farmer: activeFarmer,
      evalResult,
    });
    addAdvisoryRecord(advisory);
    setActiveCallAdvisory(advisory);
  };

  const isCooldownActive = !!profile.cooldownUntil && new Date(profile.cooldownUntil) > new Date();

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 rounded-2xl border border-emerald-800/40 text-white p-5 shadow-xl space-y-5">
      {/* Top Banner: Workflow Title & Stepper Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Operational Architecture</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Automated Advisory Workflow: Crop Selection → Trigger Engine → AI Voice Call
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time APMC price monitoring, break-even mathematical modeling, rule trigger validation & DTMF response capture.
          </p>
        </div>

        {/* Live Simulation Scenario Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setSimulationMode('normal')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              simulationMode === 'normal'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Feed
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode('price_drop')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              simulationMode === 'price_drop'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-300/80 hover:text-rose-200'
            }`}
          >
            -14% Drop
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode('price_rise')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              simulationMode === 'price_rise'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-300/80 hover:text-emerald-200'
            }`}
          >
            +15% Surge
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode('storage_favorable')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              simulationMode === 'storage_favorable'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-300/80 hover:text-amber-200'
            }`}
          >
            Storage Profit
          </button>
        </div>
      </div>

      {/* 6-Stage Visual Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
        {/* Step 1 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Step 1: Auth</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-white text-[11px] truncate">{activeFarmer.name}</div>
          <div className="text-[10px] text-slate-400 truncate">
            {activeFarmer.phone} ({activeFarmer.preferredLanguage})
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Step 2: Crop</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-300 focus:outline-none"
            >
              <option value="Soybean">Soybean</option>
              <option value="Cotton">Cotton</option>
              <option value="Tur">Tur</option>
              <option value="Onion">Onion</option>
              <option value="Jowar">Jowar</option>
            </select>
          </div>
          <div className="text-[10px] text-slate-400 truncate">{matchedMandi.market}</div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Step 3: Metrics</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-white text-[11px]">₹{evalResult.currentPrice}/Qtl</div>
          <div className="text-[10px] text-slate-400">
            7d-Avg: ₹{evalResult.sevenDayAvgPrice} ({evalResult.priceChangePct >= 0 ? '+' : ''}
            {evalResult.priceChangePct}%)
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Step 4: Triggers</span>
            {evalResult.firedTriggers.length > 0 ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-500" />
            )}
          </div>
          <div className="font-bold text-white text-[11px]">
            {evalResult.firedTriggers.length > 0 ? (
              <span className="text-emerald-400">{evalResult.firedTriggers.length} Fired</span>
            ) : (
              <span className="text-slate-400">0 Active</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            {evalResult.isCallWorthy ? 'Call-Worthy' : 'Monitoring'}
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Step 5: Voice Call</span>
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-white text-[11px]">Multilingual IVR</div>
          <div className="text-[10px] text-slate-400">Speech Synthesis</div>
        </div>

        {/* Step 6 */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Step 6: DTMF</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-white text-[11px]">
            {profile.lastFarmerDecision ? profile.lastFarmerDecision : 'Keys 1 / 2 / 3'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {isCooldownActive ? 'Cooldown Active' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Live Computation Cards (Step 3 & 4 details) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Mandi Price & 7-Day Moving Average */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Modal Price</span>
            <span className="font-mono text-white text-xs">{matchedMandi.market}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">₹{evalResult.currentPrice}</span>
            <span className="text-xs text-slate-400 font-medium">/ Quintal</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ml-auto flex items-center gap-1 ${
                evalResult.priceChangePct >= 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {evalResult.priceChangePct >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {evalResult.priceChangePct >= 0 ? '+' : ''}
                {evalResult.priceChangePct}% vs 7d avg
              </span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
            <span>7-Day Moving Avg:</span>
            <span className="font-bold text-slate-200">₹{evalResult.sevenDayAvgPrice}/Qtl</span>
          </div>
        </div>

        {/* Card 2: Break-Even for Storage vs Selling Now */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cold Storage Break-Even</span>
            <span className="text-emerald-400 text-xs font-semibold">3-Month Term</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">₹{evalResult.breakEvenPrice}</span>
            <span className="text-xs text-slate-400 font-medium">/ Qtl required</span>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
            <span>Est. Storage Net Surplus:</span>
            <span className="font-bold text-emerald-400">
              ₹{evalResult.storageNetBenefit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Card 3: Trigger Engine Status */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Trigger Engine Status</span>
              {evalResult.isCallWorthy ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 animate-pulse">
                  CALL-WORTHY EVENT
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-medium text-[10px]">
                  Conditions Normal
                </span>
              )}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-200">
              {evalResult.firedTriggers.length > 0 ? (
                <div className="space-y-1">
                  {evalResult.triggerDescriptions.map((desc, i) => (
                    <div key={i} className="text-[11px] text-amber-300 flex items-start gap-1">
                      <span className="shrink-0">⚡</span>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 text-xs">
                  All price & storage ratios within standard thresholds. No advisory call required.
                </span>
              )}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunchCall}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                evalResult.isCallWorthy
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-2 ring-emerald-400/40'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>
                {evalResult.isCallWorthy
                  ? 'Initiate Automated AI Advisory Call →'
                  : 'Test AI Voice Call Preview'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Script Preview & DTMF Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>LLM Synthesized Speech Script (Local Language Voice Call)</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Phone: {activeFarmer.phone} | Dial Tone IVR
          </span>
        </div>
        <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-sans leading-relaxed text-[11px] italic">
          "{evalResult.llmDraftScript.mr}"
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400">
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <strong className="text-emerald-400 font-mono">Press 1:</strong> Sell Now (विक्री)
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <strong className="text-emerald-400 font-mono">Press 2:</strong> Store in Facility (साठवणूक)
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <strong className="text-amber-400 font-mono">Press 3:</strong> Call Again in 3 Days (पुन्हा फोन)
          </div>
        </div>
      </div>

      {/* Active Call Modal */}
      {activeCallAdvisory && (
        <SimulatedCallModal
          isOpen={true}
          onClose={() => setActiveCallAdvisory(null)}
          advisory={activeCallAdvisory}
          farmerPhone={activeFarmer.phone}
        />
      )}
    </div>
  );
};
