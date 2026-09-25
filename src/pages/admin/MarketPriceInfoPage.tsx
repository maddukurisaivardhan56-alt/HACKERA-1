import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate } from '../../utils/formatters';
import {
  TrendingUp,
  Search,
  ArrowUpDown,
  Store,
  Sparkles,
  Share2,
  CheckCircle2,
  MapPin,
  Send,
  X,
} from 'lucide-react';

export const MarketPriceInfoPage: React.FC = () => {
  const { mandis, farmers, currentLanguage } = useApp();

  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'modalPrice' | 'arrivalQuantityQuintals' | 'priceTrendPct7d'>('modalPrice');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Helper advisory modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [selectedMandiId, setSelectedMandiId] = useState<string>(mandis[0]?.id || '');
  const [officerNote, setOfficerNote] = useState('');
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);

  const commodities = useMemo(() => Array.from(new Set(mandis.map((m) => m.commodity))), [mandis]);
  const districts = useMemo(() => Array.from(new Set(mandis.map((m) => m.district))), [mandis]);

  const filteredMandis = useMemo(() => {
    return mandis
      .filter((m) => {
        const matchesCrop = selectedCrop === 'All' || m.commodity.toLowerCase() === selectedCrop.toLowerCase();
        const matchesDistrict = selectedDistrict === 'All' || m.district.toLowerCase() === selectedDistrict.toLowerCase();
        const matchesSearch =
          searchQuery === '' ||
          m.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.variety.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCrop && matchesDistrict && matchesSearch;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [mandis, selectedCrop, selectedDistrict, searchQuery, sortField, sortAsc]);

  // Highlight selling opportunities: markets where modal price is above the average for that commodity
  const sellingOpportunities = useMemo(() => {
    const commodityAvgs: Record<string, number> = {};
    commodities.forEach((c) => {
      const matching = mandis.filter((m) => m.commodity === c);
      const avg = matching.reduce((acc, m) => acc + m.modalPrice, 0) / (matching.length || 1);
      commodityAvgs[c] = avg;
    });

    return mandis
      .filter((m) => m.modalPrice > (commodityAvgs[m.commodity] || 0))
      .map((m) => ({
        ...m,
        premium: m.modalPrice - Math.round(commodityAvgs[m.commodity] || 0),
      }))
      .slice(0, 3);
  }, [mandis, commodities]);

  const handleShareMarketInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const farmer = farmers.find((f) => f.id === selectedFarmerId);
    const mandi = mandis.find((m) => m.id === selectedMandiId);
    if (!farmer || !mandi) return;

    setShareSuccessNotice(
      currentLanguage === 'mr'
        ? `${farmer.name} यांना ${mandi.market} चे बाजारभाव (${formatINR(mandi.modalPrice)}/क्विंटल) यशस्वीरित्या पाठवले.`
        : currentLanguage === 'hi'
        ? `${farmer.name} को ${mandi.market} के मंडी भाव (${formatINR(mandi.modalPrice)}/क्विंटल) सफलतापूर्वक भेजे गए।`
        : `Market update for ${mandi.market} (${formatINR(mandi.modalPrice)}/Qtl) prepared and dispatched for ${farmer.name}.`
    );

    setTimeout(() => {
      setIsShareModalOpen(false);
      setShareSuccessNotice(null);
      setOfficerNote('');
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5 text-[#064E3B]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentLanguage === 'mr'
                  ? 'बाजार व भाव माहिती'
                  : currentLanguage === 'hi'
                  ? 'मंडी एवं मूल्य जानकारी'
                  : 'Market and Price Information'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentLanguage === 'mr'
                  ? 'बाजार समित्यांमधील दर, विक्रीच्या संधी तपासा आणि शेतकऱ्यांना योग्य बाजार माहिती द्या.'
                  : currentLanguage === 'hi'
                  ? 'मंडी समितियों के भाव, बिक्री अवसर देखें और किसानों को सटीक बाजार जानकारी पहुँचाएं।'
                  : 'View APMC mandi price feeds, analyze selling opportunities, and guide farmers to optimal markets.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#043D2E] transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>
            {currentLanguage === 'mr'
              ? 'शेतकऱ्याला बाजार माहिती पाठवा'
              : currentLanguage === 'hi'
              ? 'किसान को बाजार जानकारी भेजें'
              : 'Share Market Info with Farmer'}
          </span>
        </button>
      </div>

      {/* Selling Opportunities Radar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {currentLanguage === 'mr'
                ? 'सध्याच्या मुख्य विक्री संधी (प्रीमियम बाजार)'
                : currentLanguage === 'hi'
                ? 'वर्तमान मुख्य बिक्री अवसर (प्रीमियम मंडियां)'
                : 'Key Selling Opportunities & Price Premiums'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Based on APMC average spreads
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {sellingOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{opp.market}</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  +{formatINR(opp.premium)}/Qtl premium
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {opp.commodity} ({opp.variety})
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100">
                <span className="font-bold text-slate-900">{formatINR(opp.modalPrice)}/Qtl</span>
                <span className="text-slate-500 text-[11px]">{opp.arrivalQuantityQuintals.toLocaleString()} Qtl arrivals</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Commodity Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentLanguage === 'mr' ? 'पीक निवडा' : currentLanguage === 'hi' ? 'फसल चुनें' : 'Filter by Commodity'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">{currentLanguage === 'mr' ? 'सर्व पिके' : currentLanguage === 'hi' ? 'सभी फसलें' : 'All Commodities'}</option>
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentLanguage === 'mr' ? 'जिल्हा निवडा' : currentLanguage === 'hi' ? 'जिला चुनें' : 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">{currentLanguage === 'mr' ? 'सर्व जिल्हे' : currentLanguage === 'hi' ? 'सभी जिले' : 'All Districts'}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentLanguage === 'mr' ? 'बाजार समिती किंवा जात शोधा' : currentLanguage === 'hi' ? 'मंडी खोजें' : 'Search Mandi / Variety'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Lasalgaon, Pimpalgaon..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Results Counter */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center text-xs">
            <span className="text-slate-500 text-[11px]">
              {currentLanguage === 'mr' ? 'उपलब्ध बाजार' : currentLanguage === 'hi' ? 'सक्रिय मंडियां' : 'Active Markets'}
            </span>
            <span className="font-bold text-slate-900">
              {filteredMandis.length} {currentLanguage === 'mr' ? 'बाजार समित्या' : currentLanguage === 'hi' ? 'मंडियां' : 'Markets Listed'}
            </span>
          </div>
        </div>
      </div>

      {/* Mandi Price Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            {currentLanguage === 'mr' ? 'थेट बाजारभाव तालिका (APMC)' : currentLanguage === 'hi' ? 'लाइव मंडी भाव तालिका' : 'Live Mandi Price Ledger'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredMandis.length} {currentLanguage === 'mr' ? 'नोंदी' : currentLanguage === 'hi' ? 'प्रविष्टियां' : 'Entries'}
          </span>
        </div>

        {filteredMandis.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <p className="font-semibold text-slate-700 text-sm">
              {currentLanguage === 'mr' ? 'कोणतीही बाजार माहिती उपलब्ध नाही' : currentLanguage === 'hi' ? 'कोई मंडी डेटा उपलब्ध नहीं है' : 'No mandi records found.'}
            </p>
            <p className="text-slate-400">
              {currentLanguage === 'mr' ? 'कृपया आपले फिल्टर निकष बदला.' : currentLanguage === 'hi' ? 'कृपया अपने फ़िल्टर बदलें।' : 'Try clearing your search query or filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Market & Commodity</th>
                  <th className="py-3 px-3">District</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => {
                      if (sortField === 'modalPrice') setSortAsc((prev) => !prev);
                      else {
                        setSortField('modalPrice');
                        setSortAsc(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Modal Price</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Min - Max Range</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => {
                      if (sortField === 'arrivalQuantityQuintals') setSortAsc((prev) => !prev);
                      else {
                        setSortField('arrivalQuantityQuintals');
                        setSortAsc(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Arrivals (Qtl)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">7d Trend</th>
                  <th className="py-3 px-4 text-right">Reported Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMandis.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{m.market}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.commodity} • {m.variety} ({m.grade})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{m.district}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                      {formatINR(m.modalPrice)}
                      <span className="text-[10px] font-normal text-slate-400 block">per {m.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      {formatINR(m.minPrice)} - {formatINR(m.maxPrice)}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {m.arrivalQuantityQuintals.toLocaleString()} Qtl
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          (m.priceTrendPct7d || 0) >= 0
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {(m.priceTrendPct7d || 0) >= 0 ? '+' : ''}
                        {m.priceTrendPct7d}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {formatDate(m.reportedDate)}
                      <span className="text-[10px] text-slate-400 block">{m.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share Market Info Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {currentLanguage === 'mr' ? 'शेतकऱ्याला बाजार सल्ला पाठवा' : currentLanguage === 'hi' ? 'किसान को बाजार सलाह भेजें' : 'Share Market Information with Farmer'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prepare and transmit current APMC market pricing and selling guidance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shareSuccessNotice}</span>
              </div>
            )}

            <form onSubmit={handleShareMarketInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Farmer:
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.village} • {f.primaryCrop})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Recommended APMC Market:
                </label>
                <select
                  value={selectedMandiId}
                  onChange={(e) => setSelectedMandiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  {mandis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.market} ({m.commodity} — {formatINR(m.modalPrice)}/Qtl)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Officer Note / Selling Guidance:
                </label>
                <textarea
                  rows={3}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="e.g. Current arrivals are favorable. Selling today or tomorrow morning recommended before new weekend volume."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#043D2E] shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Market Advisory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
