import React from 'react';
import { Header } from './Header';
import { Globe, Download, LogOut, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface SettingsProps {
    language: Language;
    onLanguageChange: () => void;
    installPrompt: any;
    onInstallClick: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
    language,
    onLanguageChange,
    installPrompt,
    onInstallClick
}) => {
    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem('c3talk_lang');
    };

    return (
        <div className="flex flex-col h-full bg-black text-white">
            <Header title="Settings" />

            <div className="flex-1 overflow-y-auto px-6 py-8 pb-24 space-y-6 fade-in">
                {/* Language Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider px-2">
                        Language
                    </h3>
                    <button
                        onClick={onLanguageChange}
                        className="w-full p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#E50914]/10 rounded-xl">
                                <Globe size={24} className="text-[#E50914]" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">Change Language</p>
                                <p className="text-sm text-neutral-400">Current: {language}</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-neutral-600" />
                    </button>
                </div>

                {/* App Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider px-2">
                        App
                    </h3>

                    {installPrompt && (
                        <button
                            onClick={onInstallClick}
                            className="w-full p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <Download size={24} className="text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-semibold">Install App</p>
                                    <p className="text-sm text-neutral-400">Add to home screen</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-neutral-600" />
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all hover:border-red-900/50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl">
                                <LogOut size={24} className="text-red-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold">Logout</p>
                                <p className="text-sm text-neutral-400">Sign out of your account</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-neutral-600" />
                    </button>
                </div>

                {/* App Info */}
                <div className="pt-8 px-2 space-y-2">
                    <p className="text-xs text-neutral-600 uppercase tracking-widest">
                        C3TALK v1.0.0
                    </p>
                    <p className="text-xs text-neutral-700">
                        Breaking communication barriers for Amharic and Oromo speakers
                    </p>
                </div>
            </div>
        </div>
    );
};
