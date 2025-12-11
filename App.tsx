import React, { useState, useEffect } from 'react';
import { AppMode, Language } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceFlow } from './components/VoiceFlow';
import { TextFlow } from './components/TextFlow';
import { MainScreen } from './components/MainScreen';
import { LoginScreen } from './components/LoginScreen';
import { Paywall } from './components/Paywall';
import { trackPageView } from './services/analytics';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { initializeUserCredits, getGuestCredits } from './services/creditService';

// Interface for the PWA install event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN); // Default to LOGIN/ONBOARDING logic
  const [language, setLanguage] = useState<Language | null>(null);
  const [hasSharedContent, setHasSharedContent] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false); // Toggle for Login Screen

  // Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Wait for initial auth state to be fully resolved (persisted sessions)
      try {
        await (auth as any).authStateReady?.();
      } catch {}

      const current = auth.currentUser;

      if (current) {
        setIsAuthenticated(true);
        setIsAuthLoading(false);
        setShowLogin(false);

        console.log("✅ Current User ID:", current.uid);

        await initializeUserCredits(current.uid);

        const savedLang = localStorage.getItem('c3talk_lang');
        if (savedLang) {
          setLanguage(savedLang as Language);
          setMode(AppMode.HOME);
        } else {
          setMode(AppMode.ONBOARDING);
        }
      } else {
        // No persisted user. Only attempt anonymous sign-in if online.
        if (navigator.onLine) {
          console.log("No user, online — signing in anonymously...");
          signInAnonymously(auth).catch((error) => {
            console.error("Anonymous Auth Error:", error);
            setIsAuthLoading(false);
          });
        } else {
          console.log("No user and offline — skipping anonymous sign-in");
          setIsAuthLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Credit Listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    if (user.isAnonymous) {
      setCredits(getGuestCredits());
      const handler = () => setCredits(getGuestCredits());
      window.addEventListener('c3talk:credits-updated', handler);
      return () => window.removeEventListener('c3talk:credits-updated', handler);
    }
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setCredits(doc.data().balance);
      }
    });
    return () => unsubscribe();
  }, [isAuthenticated, auth.currentUser?.uid]);

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

  // Show Login Screen Overlay
  if (showLogin) {
    return <LoginScreen onBack={() => setShowLogin(false)} />;
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
        credits={credits}
        onLoginClick={() => setShowLogin(true)}
      />
    );
  }

  if (mode === AppMode.TEXT_FLOW && language) {
    return <TextFlow language={language} onBack={() => setMode(AppMode.HOME)} credits={credits} onLoginClick={() => setShowLogin(true)} />;
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
        credits={credits}
      />
    );
  }

  // Render Onboarding (Language Selector)
  return <LanguageSelector onSelect={handleLanguageSelect} />;
};

export default App;
