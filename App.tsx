import React, { useState, useEffect } from 'react';
import { AppMode, Language } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceFlow } from './components/VoiceFlow';
import { TextFlow } from './components/TextFlow';
import { MainScreen } from './components/MainScreen';
import { LoginScreen } from './components/LoginScreen';
import { trackPageView } from './services/analytics';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Interface for the PWA install event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN);
  const [language, setLanguage] = useState<Language | null>(null);
  const [hasSharedContent, setHasSharedContent] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthLoading(false);
      if (user) {
        setIsAuthenticated(true);
        // Check for saved language preferences or onboarding state
        const savedLang = localStorage.getItem('c3talk_lang');
        if (savedLang) {
          setLanguage(savedLang as Language);
          setMode(AppMode.HOME);
        } else {
          setMode(AppMode.ONBOARDING);
        }
      } else {
        setIsAuthenticated(false);
        setMode(AppMode.LOGIN);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Capture the PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Check for shared content redirection
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'share-voice') {
      setHasSharedContent(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Effect to automatically route to VoiceFlow if a share was detected and language is set
  useEffect(() => {
    if (isAuthenticated && hasSharedContent && language) {
      setMode(AppMode.VOICE_FLOW);
    }
  }, [hasSharedContent, language, isAuthenticated]);

  // Analytics
  useEffect(() => {
    let virtualPath = '/';
    switch (mode) {
      case AppMode.LOGIN:
        virtualPath = '/login';
        break;
      case AppMode.ONBOARDING:
        virtualPath = '/onboarding';
        break;
      case AppMode.HOME:
        virtualPath = '/home';
        break;
      case AppMode.VOICE_FLOW:
        virtualPath = '/voice-translation';
        break;
      case AppMode.TEXT_FLOW:
        virtualPath = '/text-translation';
        break;
      default:
        virtualPath = '/';
    }
    trackPageView(virtualPath);
  }, [mode]);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('c3talk_lang', lang);
    if (!hasSharedContent) {
      setMode(AppMode.HOME);
    }
  };

  const resetSettings = () => {
    localStorage.removeItem('c3talk_lang');
    setLanguage(null);
    setMode(AppMode.ONBOARDING);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-pulse text-[#E50914] font-bold text-xl">C3TALK...</div>
      </div>
    );
  }

  // Auth Guard
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Render Flows
  if (mode === AppMode.VOICE_FLOW && language) {
    return (
      <VoiceFlow
        language={language}
        onBack={() => {
          setHasSharedContent(false);
          setMode(AppMode.HOME);
        }}
        autoLoadShared={hasSharedContent}
      />
    );
  }

  if (mode === AppMode.TEXT_FLOW && language) {
    return <TextFlow language={language} onBack={() => setMode(AppMode.HOME)} />;
  }

  // Render Main Screen (Home, History, Settings with Bottom Navigation)
  if (mode === AppMode.HOME && language) {
    return (
      <MainScreen
        language={language}
        onVoiceClick={() => setMode(AppMode.VOICE_FLOW)}
        onTextClick={() => setMode(AppMode.TEXT_FLOW)}
        onLanguageChange={resetSettings}
        installPrompt={installPrompt}
        onInstallClick={handleInstallClick}
      />
    );
  }

  // Render Onboarding
  return <LanguageSelector onSelect={handleLanguageSelect} />;
};

export default App;