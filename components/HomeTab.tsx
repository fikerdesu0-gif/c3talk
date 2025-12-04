import React from 'react';
import { Header } from './Header';
import { Mic, MessageSquareText, ChevronRight } from 'lucide-react';
import { Language } from '../types';

interface HomeTabProps {
    language: Language;
    onVoiceClick: () => void;
    onTextClick: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ language, onVoiceClick, onTextClick }) => {
    return (
        <div className="flex flex-col h-full bg-black text-white">
            <Header title="C3TALK" />

            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-center space-y-8 fade-in">
                <div className="space-y-2 mb-4">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {language === Language.AMHARIC ? 'እንኳን ደህና መጡ' : 'Baga Nagaan Dhuftan'}
                    </h2>
                    <p className="text-neutral-400 text-lg">Choose an action to start.</p>
                </div>

                <button
                    onClick={onVoiceClick}
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
                    onClick={onTextClick}
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
            </div>
        </div>
    );
};
