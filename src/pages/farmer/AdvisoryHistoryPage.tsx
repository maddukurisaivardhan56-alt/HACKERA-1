import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ScriptPreviewCard } from '../../components/advisory/ScriptPreviewCard';
import { PhoneOff } from 'lucide-react';

export const AdvisoryHistoryPage: React.FC = () => {
  const { advisories, activeFarmer, currentLanguage } = useApp();

  // Farmers can view their past call history across all monitored crops
  const farmerCalls = useMemo(() => {
    return advisories.filter((adv) => adv.farmerId === activeFarmer.id);
  }, [advisories, activeFarmer.id]);

  return (
    <div className="space-y-6">
      
      {/* Clean Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#064E3B] tracking-tight">
          {currentLanguage === 'mr' ? 'कॉल इतिहास' : currentLanguage === 'hi' ? 'कॉल इतिहास' : 'Call History'}
        </h1>
        <p className="text-xs text-[#064E3B]/70 mt-1">
          {currentLanguage === 'mr'
            ? 'शेतकरी आणि AI व्हॉइस असिस्टंट यांच्यातील मागील संभाषण.'
            : currentLanguage === 'hi'
            ? 'किसान और AI वॉइस असिस्टेंट के बीच पिछली बातचीत।'
            : 'Previous conversations between you and the AI Voice Assistant.'}
        </p>
      </div>

      {/* Call History Conversation Cards */}
      {farmerCalls.length === 0 ? (
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E0C79B] p-12 text-center text-[#064E3B]/70 text-sm shadow-2xs space-y-2">
          <PhoneOff className="w-8 h-8 text-[#064E3B]/40 mx-auto mb-1" />
          <p className="font-semibold text-[#064E3B]">
            {currentLanguage === 'mr'
              ? 'कोणताही कॉल इतिहास उपलब्ध नाही.'
              : currentLanguage === 'hi'
              ? 'कोई कॉल इतिहास उपलब्ध नहीं है।'
              : 'No call history available.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {farmerCalls.map((advisory) => (
            <ScriptPreviewCard
              key={advisory.id}
              advisory={advisory}
              farmerName={activeFarmer.name}
              preferredLanguage={currentLanguage}
            />
          ))}
        </div>
      )}

    </div>
  );
};
