import React, { useState } from 'react';
import { Copy, Send, ArrowRight, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { translateReply } from '../services/geminiService';

interface ReplySectionProps {
  language: Language;
}

export const ReplySection: React.FC<ReplySectionProps> = ({ language }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setTranslatedText('');
    setIsCopied(false);
    
    try {
      const result = await translateReply(inputText, language);
      setTranslatedText(result.translation);
    } catch (e) {
      alert("Error translating reply");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="mt-10 pt-10 border-t border-neutral-800">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-white rounded-full"></span>
        {language === Language.AMHARIC ? 'መልስ (Reply)' : 'Deebii (Reply)'}
      </h3>
      
      {/* Input Area - Redesigned with floating button */}
      <div className="relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={language === Language.AMHARIC ? 'እዚህ ይጻፉ...' : 'Asitti barreessi...'}
          className="w-full h-36 p-5 pr-16 bg-neutral-900 border border-neutral-800 rounded-3xl text-lg text-white placeholder:text-neutral-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none resize-none transition-all"
        />
        <button 
            onClick={handleTranslate}
            disabled={!inputText.trim() || isTranslating}
            className={`absolute bottom-3 right-3 p-3 rounded-full transition-all shadow-lg flex items-center justify-center ${
                inputText.trim() 
                ? 'bg-[#E50914] text-white hover:bg-[#b8070f] active:scale-95' 
                : 'bg-neutral-800 text-neutral-600'
            }`}
        >
            {isTranslating ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} className="stroke-[3]" />}
        </button>
      </div>

      {/* Result Area */}
      {translatedText && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1f1f1f] border border-neutral-700 p-6 rounded-3xl relative overflow-hidden">
             {/* Subtle Glow */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/20 blur-3xl rounded-full"></div>

            <p className="text-xs text-blue-400 mb-3 font-bold uppercase tracking-widest">English Reply</p>
            <p className="text-xl text-white leading-relaxed font-medium mb-6">{translatedText}</p>
            
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all duration-300 ${
                isCopied 
                  ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
              }`}
            >
              {isCopied ? (
                <>
                  <Send size={20} className="fill-current" />
                  <span>Copied Successfully</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span>Copy Reply</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};