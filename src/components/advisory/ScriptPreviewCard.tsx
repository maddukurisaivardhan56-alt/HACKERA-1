import React, { useState } from 'react';
import { AdvisoryRecord, Language } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { AudioPlayerWidget } from './AudioPlayerWidget';
import { PhoneIncoming, CheckCircle2, Clock, Bot, User, MessageSquare } from 'lucide-react';

interface ScriptPreviewCardProps {
  advisory: AdvisoryRecord;
  farmerName?: string;
  preferredLanguage?: Language;
}

export const ScriptPreviewCard: React.FC<ScriptPreviewCardProps> = ({
  advisory,
  farmerName = 'Farmer',
  preferredLanguage = 'mr',
}) => {
  const [activeTab, setActiveTab] = useState<Language>(preferredLanguage);

  React.useEffect(() => {
    setActiveTab(preferredLanguage);
  }, [preferredLanguage]);

  const callTitles: Record<string, Record<string, string>> = {
    'adv-001': {
      mr: 'कांदा बाजारभाव व शीतगृह साठवणूक सल्ला कॉल',
      hi: 'प्याज मंडी भाव एवं शीतगृह भंडारण परामर्श कॉल',
      en: 'Onion Market Price & Cold Storage Advisory Call',
      te: 'ఉల్లిపాయ మార్కెట్ ధర మరియు శీతల నిల్వ సలహా కాల్',
    },
    'adv-002': {
      mr: 'टोमॅटो बाजारभाव कल व सल्ला कॉल',
      hi: 'टमाटर मंडी भाव रुझान एवं परामर्श कॉल',
      en: 'Tomato Market Price Trend & Advisory Call',
      te: 'టమోటా మార్కెట్ ధర ధోరణి మరియు సలహా కాల్',
    },
    'adv-003': {
      mr: 'सोयाबीन बाजारभाव व विक्री सल्ला कॉल',
      hi: 'सोयाबीन मंडी भाव एवं बिक्री परामर्श कॉल',
      en: 'Soybean Market Price & Sale Advisory Call',
      te: 'సోయాబీన్ మార్కెట్ ధర మరియు విక్రయ సలహా కాల్',
    },
  };

  const topic =
    callTitles[advisory.id]?.[activeTab] ||
    callTitles[advisory.id]?.en ||
    advisory.headline;

  const conversation = advisory.conversation || [
    {
      speaker: 'ai' as const,
      textMarathi: advisory.messageMarathi,
      textHindi: advisory.messageHindi,
      textEnglish: advisory.messageEnglish,
    },
  ];

  return (
    <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] shadow-2xs overflow-hidden">
      {/* Call Header */}
      <div className="p-4 sm:p-5 border-b border-[#E0C79B]/50 bg-[#F8E7C9]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#064E3B] text-[#F8E7C9] flex items-center justify-center shrink-0">
            <PhoneIncoming className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#064E3B]">
                {topic}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#064E3B]" />
                <span className="capitalize">{advisory.callStatus}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#064E3B]/70 mt-1">
              <span className="inline-flex items-center gap-1 font-medium text-[#064E3B]/80">
                <Clock className="w-3.5 h-3.5 text-[#064E3B]/60" />
                {formatDateTime(advisory.generatedAt)}
              </span>
              <span>•</span>
              <span className="font-medium text-[#064E3B]/80">
                {activeTab === 'mr' ? 'कालावधी:' : activeTab === 'hi' ? 'अवधि:' : 'Duration:'}{' '}
                <strong className="text-[#064E3B]">{advisory.callDurationSeconds || 45} {activeTab === 'mr' ? 'सेकंद' : activeTab === 'hi' ? 'सेकंड' : 'seconds'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Language selector for reading conversation transcript */}
        <div className="inline-flex rounded-lg border border-[#E0C79B] bg-[#FFFDF7] p-0.5 text-xs self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('mr')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'mr' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-[#064E3B]/70 hover:text-[#064E3B]'
            }`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hi')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'hi' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-[#064E3B]/70 hover:text-[#064E3B]'
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'en' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-[#064E3B]/70 hover:text-[#064E3B]'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Conversation Exchange */}
      <div className="p-4 sm:p-6 space-y-3.5 bg-[#F8E7C9]/15">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#064E3B]/60 mb-3 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#064E3B]" />
          <span>
            {activeTab === 'mr'
              ? 'कॉल संभाषण संवाद'
              : activeTab === 'hi'
              ? 'कॉल बातचीत संवाद'
              : 'Call Conversation Transcript'}
          </span>
        </div>

        <div className="space-y-3">
          {conversation.map((exchange, idx) => {
            const isAi = exchange.speaker === 'ai';
            const text =
              activeTab === 'mr'
                ? exchange.textMarathi
                : activeTab === 'hi'
                ? exchange.textHindi
                : exchange.textEnglish;

            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-full bg-[#064E3B] text-[#F8E7C9] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4 text-[#F8E7C9]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                    isAi
                      ? 'bg-[#064E3B]/10 border border-[#064E3B]/20 text-[#064E3B] rounded-tl-xs'
                      : 'bg-white border border-[#E0C79B] text-slate-900 rounded-tr-xs ml-auto'
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#064E3B]/60 uppercase tracking-wider mb-1">
                    {isAi
                      ? (activeTab === 'mr' ? 'AI व्हॉइस असिस्टंट' : activeTab === 'hi' ? 'AI वॉइस असिस्टेंट' : 'AI Voice Assistant')
                      : `${farmerName} (${activeTab === 'mr' ? 'शेतकरी' : activeTab === 'hi' ? 'किसान' : 'Farmer'})`}
                  </div>
                  <p>{text}</p>
                </div>

                {!isAi && (
                  <div className="w-7 h-7 rounded-full bg-[#064E3B]/20 text-[#064E3B] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 font-bold">
                    <User className="w-4 h-4 text-[#064E3B]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio Playback Bar */}
      <div className="p-3 sm:p-4 bg-[#F8E7C9]/30 border-t border-[#E0C79B]/50">
        <AudioPlayerWidget advisory={advisory} language={activeTab} />
      </div>
    </div>
  );
};
