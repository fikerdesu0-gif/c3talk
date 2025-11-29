import React from 'react';
import { ChevronLeft, Settings } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  onSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, onSettings }) => {
  return (
    <div className="h-16 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
      <div className="w-10">
        {onBack && (
          <button onClick={onBack} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      
      <h2 className="text-lg font-semibold tracking-wide text-white">{title}</h2>
      
      <div className="w-10 flex justify-end">
         {onSettings && (
          <button onClick={onSettings} className="p-2 text-white/60 hover:text-white rounded-full transition-colors">
            <Settings size={20} />
          </button>
        )}
      </div>
    </div>
  );
};