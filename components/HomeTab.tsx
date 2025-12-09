import React from 'react';
import { Header } from './Header';
import { Mic, MessageSquareText, ChevronRight, CreditCard } from 'lucide-react';
import { Language } from '../types';

interface HomeTabProps {
    language: Language;
    onVoiceClick: () => void;
    onTextClick: () => void;
    credits: number | null;
}

export const HomeTab: React.FC<HomeTabProps> = ({ language, onVoiceClick, onTextClick, credits }) => {
    // If credits are 0, App.tsx shows the Paywall, so we don't need to handle it here.
    // But we can show a low credit warning if needed (e.g. 1 credit left).

    return (
        <div className="flex flex-col h-full bg-black text-white relative">
            <Header title="C3TALK" />

            <div className="flex-1 overflow-y-auto px-6 py-8 pb-24 flex flex-col justify-center space-y-8 fade-in">
                <div className="space-y-2 mb-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words">
                            {language === Language.AMHARIC ? 'እንኳን ደህና መጡ' : 'Baga Nagaan Dhuftan'}
                        </h2>
                        {credits !== null && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 self-start sm:self-auto">
                                <CreditCard className="w-[clamp(14px,4vw,16px)] h-[clamp(14px,4vw,16px)]" />
                                <span className="font-bold">{credits} Credits</span>
                            </div>
                        )}
                    </div>
                    <p className="text-neutral-400 text-base sm:text-lg break-words">Choose an action to start.</p>
                </div>

                <button
                    onClick={onVoiceClick}
                    className="group relative w-full p-6 sm:p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden text-left active:scale-[0.98]"
                >
                    <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Mic className="w-[clamp(64px,12vw,100px)] h-[clamp(64px,12vw,100px)]" />
                    </div>
                    <div className="relative z-10 flex flex-col items-start space-y-4 pr-[clamp(48px,12vw,100px)]">
                        <div className="p-3 bg-[#E50914] rounded-2xl text-white shadow-lg shadow-red-900/20">
                            <Mic className="w-[clamp(20px,5vw,28px)] h-[clamp(20px,5vw,28px)]" />
                        </div>
                        <div>
                            <span className="block text-xl sm:text-2xl font-bold text-white break-words whitespace-normal">Voice Note</span>
                            <span className="block text-sm sm:text-base text-neutral-400 mt-1 break-words whitespace-normal">Transcribe & Translate Audio</span>
                        </div>
                    </div>
                    <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 text-neutral-600 group-hover:text-white transition-colors">
                        <ChevronRight className="w-[clamp(18px,5vw,24px)] h-[clamp(18px,5vw,24px)]" />
                    </div>
                </button>

                <button
                    onClick={onTextClick}
                    className="group relative w-full p-6 sm:p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden text-left active:scale-[0.98]"
                >
                    <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MessageSquareText className="w-[clamp(64px,12vw,100px)] h-[clamp(64px,12vw,100px)]" />
                    </div>
                    <div className="relative z-10 flex flex-col items-start space-y-4 pr-[clamp(48px,12vw,100px)]">
                        <div className="p-3 bg-white/10 rounded-2xl text-white backdrop-blur-md">
                            <MessageSquareText className="w-[clamp(20px,5vw,28px)] h-[clamp(20px,5vw,28px)]" />
                        </div>
                        <div>
                            <span className="block text-xl sm:text-2xl font-bold text-white break-words whitespace-normal">Text Message</span>
                            <span className="block text-sm sm:text-base text-neutral-400 mt-1 break-words whitespace-normal">Paste & Translate Text</span>
                        </div>
                    </div>
                    <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 text-neutral-600 group-hover:text-white transition-colors">
                        <ChevronRight className="w-[clamp(18px,5vw,24px)] h-[clamp(18px,5vw,24px)]" />
                    </div>
                </button>
            </div>
        </div>
    );
};
