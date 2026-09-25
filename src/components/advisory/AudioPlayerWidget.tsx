import React, { useState } from 'react';
import { Play, Pause, Volume2, Globe } from 'lucide-react';
import { AdvisoryRecord, Language } from '../../types';
import { TelephonyService } from '../../services/telephonyService';

interface AudioPlayerWidgetProps {
  advisory: AdvisoryRecord;
  language?: Language;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({
  advisory,
  language: propLanguage,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [internalLanguage, setInternalLanguage] = useState<Language>(propLanguage || 'mr');

  const language = propLanguage || internalLanguage;

  React.useEffect(() => {
    if (propLanguage) {
      setInternalLanguage(propLanguage);
      if (isPlaying) {
        TelephonyService.stopSpeaking();
        setIsPlaying(false);
      }
    }
  }, [propLanguage]);

  const togglePlay = () => {
    if (isPlaying) {
      TelephonyService.stopSpeaking();
      setIsPlaying(false);
    } else {
      const script = TelephonyService.getLanguageScript(advisory, language);
      setIsPlaying(true);
      TelephonyService.speakText(script, language, () => {
        setIsPlaying(false);
      });
    }
  };

  const handleLangChange = (lang: Language) => {
    setInternalLanguage(lang);
    if (isPlaying) {
      TelephonyService.stopSpeaking();
      const script = TelephonyService.getLanguageScript(advisory, lang);
      TelephonyService.speakText(script, lang, () => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#F8E7C9]/40 border border-[#E0C79B]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-rose-600 text-white animate-pulse shadow-md'
              : 'bg-[#064E3B] text-[#F8E7C9] hover:bg-[#043D2E] shadow-xs'
          }`}
          title={isPlaying ? 'Stop Spoken Audio' : 'Listen to Spoken Advisory'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#064E3B]">
            <Volume2 className="w-3.5 h-3.5 text-[#064E3B]" />
            <span>AI Voice Advisory Audio ({language.toUpperCase()})</span>
          </div>
          <p className="text-[11px] text-[#064E3B]/70">
            {isPlaying ? 'Speaking through browser speech engine...' : 'Click to listen in Marathi, Hindi, or English'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 self-end sm:self-center">
        <Globe className="w-3.5 h-3.5 text-[#064E3B]/60 mr-1 hidden sm:inline" />
        <div className="inline-flex rounded-lg border border-[#E0C79B] bg-[#FFFDF7] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => handleLangChange('mr')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              language === 'mr' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-[#064E3B]/70 hover:text-[#064E3B]'
            }`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => handleLangChange('hi')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              language === 'hi' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-[#064E3B]/70 hover:text-[#064E3B]'
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => handleLangChange('en')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              language === 'en' ? 'bg-[#064E3B] text-[#F8E7C9] font-bold' : 'text-[#064E3B]/70 hover:text-[#064E3B]'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};
