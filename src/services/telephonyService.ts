import { AdvisoryRecord, FarmerProfile, Language } from '../types';

export type SimulatedCallStep = 'idle' | 'initiating' | 'ringing' | 'connected' | 'speaking' | 'completed' | 'failed';

export interface TelephonySimulationState {
  step: SimulatedCallStep;
  progressPct: number;
  activeLanguage: Language;
  transcriptText: string;
  callDurationSeconds: number;
  simulatedCallSid: string;
  carrierLog: string[];
}

export const TelephonyService = {
  /**
   * Speak script using browser SpeechSynthesis API if available, or fall back to simulation timer
   */
  speakText(text: string, lang: Language, onEnd?: () => void): () => void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      if (lang === 'mr') {
        utterance.lang = 'mr-IN';
      } else if (lang === 'hi') {
        utterance.lang = 'hi-IN';
      } else if (lang === 'te') {
        utterance.lang = 'te-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);

      return () => {
        window.speechSynthesis.cancel();
      };
    } else {
      const timer = setTimeout(() => {
        if (onEnd) onEnd();
      }, 5000);
      return () => clearTimeout(timer);
    }
  },

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  getLanguageScript(advisory: AdvisoryRecord, lang: Language): string {
    if (lang === 'mr') return advisory.messageMarathi;
    if (lang === 'hi') return advisory.messageHindi;
    if (lang === 'te') return advisory.messageTelugu || advisory.messageEnglish;
    return advisory.messageEnglish;
  },

  generateDemoCallSid(): string {
    return `EXO-SIM-${Math.random().toString(36).substring(2, 9).toUpperCase()}-MH`;
  },
};
