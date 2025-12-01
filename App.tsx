import React, { useState, useEffect } from 'react';
import { Mic, MessageSquareText, ChevronRight, Download, LogOut } from 'lucide-react';
import { AppMode, Language } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceFlow } from './components/VoiceFlow';
import { TextFlow } from './components/TextFlow';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { trackPageView } from './services/analytics';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('c3talk_lang');
    setLanguage(null);
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

  // Render Home
  if (mode === AppMode.HOME && language) {
    return (
      <div className="flex-1 flex flex-col bg-black text-white">
        <Header title="C3TALK" onSettings={resetSettings} />
        
        <div className="flex-1 px-6 py-8 flex flex-col justify-center space-y-8 fade-in">
            <div className="space-y-2 mb-4">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {language === Language.AMHARIC ? 'እንኳን ደህና መጡ' : 'Baga Nagaan Dhuftan'}
                </h2>
                <p className="text-neutral-400 text-lg">Choose an action to start.</p>
            </div>

            {/* Install Button */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-4 bg-[#E50914] text-white rounded-3xl font-bold shadow-[0_0_20px_rgba(229,9,20,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <Download size={24} className="stroke-[3]" />
                <span className="text-lg">Install App</span>
              </button>
            )}

            <button
                onClick={() => setMode(AppMode.VOICE_FLOW)}
                className="group relative w-full p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl active:scale-[0.98] transition-all duration-300 overflow-hidden text-left"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Mic size={100} />
                </div>
                <div className="relative z-10 flex flex-col items-start space-y-4">
                    <div className="p-3 bg-[#E50914] rounded-2xl text-white shadow-lg shadow-red-900/20">
                        <Mic size={28} />
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-white">Voice Note</span>
                        <span className="block text-neutral-400 mt-1">Transcribe & Translate Audio</span>
                    </div>
                </div>
                <div className="absolute bottom-8 right-8 text-neutral-600 group-hover:text-white transition-colors">
                    <ChevronRight size={24} />
                </div>
            </button>

            <button
                onClick={() => setMode(AppMode.TEXT_FLOW)}
                className="group relative w-full p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl active:scale-[0.98] transition-all duration-300 overflow-hidden text-left"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <MessageSquareText size={100} />
                </div>
                 <div className="relative z-10 flex flex-col items-start space-y-4">
                    <div className="p-3 bg-white/10 rounded-2xl text-white backdrop-blur-md">
                        <MessageSquareText size={28} />
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-white">Text Message</span>
                        <span className="block text-neutral-400 mt-1">Paste & Translate Text</span>
                    </div>
                </div>
                <div className="absolute bottom-8 right-8 text-neutral-600 group-hover:text-white transition-colors">
                    <ChevronRight size={24} />
                </div>
            </button>
            
            <div className="flex items-center justify-between pt-8 px-2">
                 <p className="text-xs text-neutral-600 uppercase tracking-widest">
                    Active: <span className="text-[#E50914]">{language}</span>
                </p>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white uppercase tracking-widest"
                >
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Render Onboarding
  return <LanguageSelector onSelect={handleLanguageSelect} />;
};

export default App;