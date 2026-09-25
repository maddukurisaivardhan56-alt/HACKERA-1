import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { HISTORICAL_PRICE_DATA } from '../../data/initialMandis';
import { PriceTrendChart } from '../../components/charts/PriceTrendChart';
import { formatINR, formatDate } from '../../utils/formatters';
import { AlertBanner } from '../../components/common/AlertBanner';
import {
  TrendingUp,
  Search,
  ArrowUpDown,
} from 'lucide-react';

export const MandiComparisonPage: React.FC = () => {
  const { mandis, activeFarmer, t, currentLanguage } = useApp();

  // Filter States
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'modalPrice' | 'distanceKm' | 'priceTrendPct7d'>('modalPrice');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Mandis strictly filtered for active farmer's crop
  const cropMandis = useMemo(() => {
    return mandis.filter(
      (m) => m.commodity.toLowerCase() === activeFarmer.primaryCrop.toLowerCase()
    );
  }, [mandis, activeFarmer.primaryCrop]);

  // Extract unique districts for this crop's mandis
  const districts = useMemo(() => Array.from(new Set(cropMandis.map((m) => m.district))), [cropMandis]);

  // Filtered & Sorted Mandis
  const filteredMandis = useMemo(() => {
    return cropMandis
      .filter((m) => {
        const matchesDistrict = selectedDistrict === 'All' || m.district.toLowerCase() === selectedDistrict.toLowerCase();
        const matchesSearch =
          searchQuery === '' ||
          m.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.variety.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDistrict && matchesSearch;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [cropMandis, selectedDistrict, searchQuery, sortField, sortAsc]);

  const handleSort = (field: 'modalPrice' | 'distanceKm' | 'priceTrendPct7d') => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const currentChartHistory = HISTORICAL_PRICE_DATA[activeFarmer.primaryCrop] || [];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#064E3B] tracking-tight">
              {t('mandiComparisonTitle', 'Mandi Price Discovery & Comparison')}
            </h1>
          </div>
          <p className="text-xs text-[#064E3B]/70 mt-1">
            {currentLanguage === 'mr'
              ? 'महाराष्ट्र कृषी उत्पन्न बाजार समित्यांमधील (APMC) थेट बाजारभाव व ऐतिहासिक कल.'
              : currentLanguage === 'hi'
              ? 'महाराष्ट्र कृषि उपज मंडी समितियों (APMC) के लाइव भाव एवं ऐतिहासिक रुझान।'
              : 'Compare commodity prices across Maharashtra agricultural produce market committees (APMC).'}
          </p>
        </div>
      </div>

      {/* Indicative Disclaimer Banner */}
      <AlertBanner
        type="info"
        title={currentLanguage === 'mr' ? 'बाजारभाव पारदर्शकता सूचना' : currentLanguage === 'hi' ? 'मंडी भाव पारदर्शिता सूचना' : 'Market Price Transparency Notice'}
        message={
          currentLanguage === 'mr'
            ? 'बाजारभाव हे महाराष्ट्र बाजार समित्यांच्या आवक माहितीवर आधारित आहेत. मालाचा दर्जा, प्रतवारी व ओलाव्यानुसार प्रत्यक्ष लिलावात भाव बदलू शकतात.'
            : currentLanguage === 'hi'
            ? 'मंडी भाव महाराष्ट्र मंडियों की आवक जानकारी पर आधारित हैं। माल की गुणवत्ता, ग्रेडिंग और नमी के अनुसार वास्तविक नीलामी भाव में अंतर हो सकता है।'
            : 'Market prices are indicative and derived from Maharashtra APMC arrival feeds. Actual auction transaction prices may differ based on quality grading and moisture.'
        }
      />

      {/* Filters Bar */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Commodity Dropdown - Fixed to Farmer's Crop */}
          <div>
            <label className="block text-xs font-semibold text-[#064E3B] mb-1">
              {t('commodity', 'Select Commodity / Crop')}
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
              {t('district', 'District')}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E0C79B] text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
            >
              <option value="All">{currentLanguage === 'mr' ? 'सर्व जिल्हे (महाराष्ट्र)' : currentLanguage === 'hi' ? 'सभी जिले (महाराष्ट्र)' : 'All Districts (Maharashtra)'}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-semibold text-[#064E3B] mb-1">
              {currentLanguage === 'mr' ? 'बाजार समिती किंवा जात शोधा' : currentLanguage === 'hi' ? 'मंडी या किस्म खोजें' : 'Search Mandi / Variety'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Lasalgaon, Pimpalgaon..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E0C79B] text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="p-2.5 rounded-xl bg-[#F8E7C9]/40 border border-[#E0C79B] flex flex-col justify-center text-xs">
            <span className="text-[#064E3B]/70 text-[11px]">{currentLanguage === 'mr' ? 'एकूण बाजार' : currentLanguage === 'hi' ? 'कुल मंडियां' : 'Filtered Markets'}</span>
            <span className="font-bold text-[#064E3B]">
              {filteredMandis.length} {currentLanguage === 'mr' ? 'बाजार समित्या उपलब्ध' : currentLanguage === 'hi' ? 'मंडियां उपलब्ध' : 'Mandi Markets Active'}
            </span>
          </div>

        </div>
      </div>

      {/* Historical Price Trend Graph */}
      {currentChartHistory.length > 0 ? (
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0C79B]/50 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#064E3B]" />
                <h3 className="text-sm sm:text-base font-bold text-[#064E3B]">
                  {currentLanguage === 'mr' ? `३०-दिवसांचा ऐतिहासिक भाव कल — ${activeFarmer.primaryCrop}` : currentLanguage === 'hi' ? `30-दिवसीय ऐतिहासिक मूल्य रुझान — ${activeFarmer.primaryCrop}` : `30-Day Historical Price Trend — ${activeFarmer.primaryCrop}`}
                </h3>
              </div>
              <p className="text-xs text-[#064E3B]/70 mt-0.5">
                {currentLanguage === 'mr' ? 'सरासरी आणि कमाल भावातील चढ-उतार दर्शवणारा आलेख.' : currentLanguage === 'hi' ? 'मॉडल और अधिकतम भावों का उतार-चढ़ाव दर्शाने वाला आलेख।' : 'Shows average modal price and ceiling price movement across primary trading hubs.'}
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#064E3B]/70 font-semibold">
              Unit: ₹ per Quintal
            </span>
          </div>

          <PriceTrendChart commodity={activeFarmer.primaryCrop} data={currentChartHistory} />
        </div>
      ) : (
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-8 text-center text-[#064E3B]/70 text-xs shadow-2xs">
          <p className="font-semibold text-[#064E3B] text-sm">
            {currentLanguage === 'mr' ? 'या पिकासाठी माहिती उपलब्ध नाही' : currentLanguage === 'hi' ? 'इस फसल के लिए डेटा उपलब्ध नहीं है' : 'Data unavailable for this crop'}
          </p>
          <p className="text-[#064E3B]/60 mt-1">
            No historical price trend available for {activeFarmer.primaryCrop}.
          </p>
        </div>
      )}

      {/* Mandi Comparison Table */}
      <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E0C79B]/60 flex items-center justify-between bg-[#F8E7C9]/30">
          <h3 className="text-sm sm:text-base font-bold text-[#064E3B]">
            {currentLanguage === 'mr' ? 'बाजारभाव तालिका' : currentLanguage === 'hi' ? 'मंडी भाव तालिका' : 'Market Price Ledger'}
          </h3>
          <span className="text-xs text-[#064E3B]/80 font-medium">
            {filteredMandis.length} {currentLanguage === 'mr' ? 'नोंदी' : currentLanguage === 'hi' ? 'प्रविष्टियां' : 'Results'}
          </span>
        </div>

        {filteredMandis.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <p className="font-semibold text-slate-700 text-sm">
              {cropMandis.length === 0
                ? (currentLanguage === 'mr' ? 'या पिकासाठी माहिती उपलब्ध नाही' : currentLanguage === 'hi' ? 'इस फसल के लिए डेटा उपलब्ध नहीं है' : 'Data unavailable for this crop')
                : (currentLanguage === 'mr' ? 'कोणतेही रेकॉर्ड आढळले नाहीत' : currentLanguage === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No matching records found.')}
            </p>
            {cropMandis.length === 0 ? (
              <p className="text-slate-400">
                {currentLanguage === 'mr'
                  ? `${activeFarmer.primaryCrop} पिकासाठी महाराष्ट्र बाजारात कोणतेही थेट दर उपलब्ध नाहीत.`
                  : currentLanguage === 'hi'
                  ? `${activeFarmer.primaryCrop} फसल के लिए महाराष्ट्र मंडियों में कोई लाइव भाव उपलब्ध नहीं है।`
                  : `No live mandi pricing available for ${activeFarmer.primaryCrop}.`}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict('All');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
              >
                {t('navResetSeed', 'Reset Filters')}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E0C79B] bg-[#064E3B]/5 text-[#064E3B] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{t('market', 'Commodity & Market')}</th>
                  <th className="py-3 px-3">{t('district', 'District')}</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('modalPrice')}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t('modalPrice', 'Modal Price')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">{t('minMaxRange', 'Min - Max Range')}</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('distanceKm')}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t('distance', 'Est. Distance')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">{t('arrivals', 'Arrivals')}</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none text-right"
                    onClick={() => handleSort('priceTrendPct7d')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('trend7d', '7d Trend')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">{currentLanguage === 'mr' ? 'तारीख' : currentLanguage === 'hi' ? 'दिनांक' : 'Reported Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0C79B]/40">
                {filteredMandis.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F8E7C9]/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#064E3B]">{m.market}</div>
                      <div className="text-[11px] text-[#064E3B]/70">
                        {m.commodity} • {m.variety} ({m.grade})
                      </div>
                    </td>

                    <td className="py-3 px-3 text-[#064E3B]/80 font-medium">
                      {m.district}
                    </td>

                    <td className="py-3 px-3 font-bold text-[#064E3B] text-sm">
                      {formatINR(m.modalPrice)}
                      <span className="text-[10px] font-normal text-[#064E3B]/60 block">per {m.unit}</span>
                    </td>

                    <td className="py-3 px-3 text-[#064E3B]/70 text-[11px]">
                      {formatINR(m.minPrice)} - {formatINR(m.maxPrice)}
                    </td>

                    <td className="py-3 px-3 text-[#064E3B]/80 font-medium">
                      ~{m.distanceKm} km
                      <span className="text-[10px] text-[#064E3B]/60 block">from {activeFarmer.village}</span>
                    </td>

                    <td className="py-3 px-3 text-[#064E3B]/70 font-medium">
                      {m.arrivalQuantityQuintals.toLocaleString()} Qtl
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          (m.priceTrendPct7d || 0) >= 0
                            ? 'bg-[#064E3B]/10 text-[#064E3B]'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {(m.priceTrendPct7d || 0) >= 0 ? '+' : ''}
                        {m.priceTrendPct7d}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right text-[#064E3B]/70 text-[11px]">
                      {formatDate(m.reportedDate)}
                      <span className="text-[10px] text-[#064E3B]/50 block truncate max-w-[120px] ml-auto">
                        {m.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
