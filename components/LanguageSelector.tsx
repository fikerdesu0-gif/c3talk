import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-12 bg-black text-white">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <h1 className="text-5xl font-bold tracking-tighter text-[#E50914]">C3TALK</h1>
        <p className="text-lg text-neutral-400 font-light">Select your preferred language</p>
      </div>

      <div className="w-full space-y-6">
        <button
          onClick={() => onSelect(Language.AMHARIC)}
          className="group w-full py-8 bg-neutral-900 border border-neutral-800 rounded-3xl active:scale-95 transition-all duration-200 flex flex-col items-center hover:bg-neutral-800 hover:border-[#E50914]/50"
        >
          <span className="text-3xl font-bold text-white group-hover:text-[#E50914] transition-colors">አማርኛ</span>
          <span className="text-sm text-neutral-500 mt-2 uppercase tracking-widest font-medium">Amharic</span>
        </button>

        <button
          onClick={() => onSelect(Language.OROMO)}
          className="group w-full py-8 bg-neutral-900 border border-neutral-800 rounded-3xl active:scale-95 transition-all duration-200 flex flex-col items-center hover:bg-neutral-800 hover:border-[#E50914]/50"
        >
          <span className="text-3xl font-bold text-white group-hover:text-[#E50914] transition-colors">Afaan Oromoo</span>
          <span className="text-sm text-neutral-500 mt-2 uppercase tracking-widest font-medium">Oromo</span>
        </button>
      </div>
      
      <div className="absolute bottom-8 text-neutral-600 text-xs tracking-widest uppercase">
        Premium Translation Bridge
      </div>
    </div>
  );
};