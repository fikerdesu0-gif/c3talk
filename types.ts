export enum AppMode {
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  VOICE_FLOW = 'VOICE_FLOW',
  TEXT_FLOW = 'TEXT_FLOW',
  HISTORY = 'HISTORY',
}

export enum Language {
  AMHARIC = 'Amharic',
  OROMO = 'Oromo',
}

export interface TranslationResult {
  original: string;
  translated: string;
}

export interface ReplyResult {
  original: string; // The user's input in native language
  translated: string; // The English translation
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    confirmationResult: any; // For Firebase Phone Auth
    recaptchaVerifier: any; // For Firebase RecaptchaVerifier
  }
}