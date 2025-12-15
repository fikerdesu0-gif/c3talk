import React, { useState } from 'react';
import { Type, RefreshCw, Loader2, ClipboardPaste, ArrowDown } from 'lucide-react';
import { Header } from './Header';
import { Paywall } from './Paywall';
import { ReplySection } from './ReplySection';
import { Language, ProcessingState } from '../types';
import { processIncomingText } from '../services/geminiService';

interface TextFlowProps {
  language: Language;
  onBack: () => void;
  credits: number | null;
  onLoginClick: () => void;
}

export const TextFlow: React.FC<TextFlowProps> = ({ language, onBack, credits, onLoginClick }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [inputEnglish, setInputEnglish] = useState('');
  const [translation, setTranslation] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const handleTranslate = async () => {
    if (!inputEnglish.trim()) return;
    if (credits !== null && credits <= 0) {
      setShowPaywall(true);
      return;
    }
    
    // Clear previous translation and set processing state
    setTranslation('');
    setProcessingState({ status: 'processing' });

    try {
      const result = await processIncomingText(inputEnglish, language);
      setTranslation(result.translation);
      setProcessingState({ status: 'success' });
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('insufficient credits')) {
        setShowPaywall(true);
        setProcessingState({ status: 'idle' });
      } else {
        setProcessingState({ status: 'error', message: e.message || 'Translation failed.' });
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputEnglish(text);
    } catch (e) {
      console.log('Clipboard access denied');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      {showPaywall && (
        <Paywall language={language} onLoginClick={onLoginClick} onClose={() => setShowPaywall(false)} />
      )}
      <Header title="Text Message" onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-6 pb-20 fade-in">

        {/* Input Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <label className="text-neutral-400 text-sm font-semibold tracking-wide uppercase">
              English Text
            </label>
          </div>

          <div className="relative group">
            <textarea
              value={inputEnglish}
              onChange={(e) => setInputEnglish(e.target.value)}
              placeholder="Paste English text here..."
              className="w-full h-48 p-6 bg-neutral-900 border border-neutral-800 rounded-3xl text-xl text-white placeholder:text-neutral-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none resize-none transition-all duration-300 shadow-lg"
            />
            {!inputEnglish && (
              <button
                onClick={handlePaste}
                className="absolute bottom-5 right-5 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
              >
                <ClipboardPaste size={16} />
                Paste
              </button>
            )}
          </div>

          <button
            onClick={handleTranslate}
            disabled={!inputEnglish.trim() || processingState.status === 'processing'}
            className={`w-full py-5 rounded-3xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${inputEnglish.trim()
                ? 'bg-[#E50914] text-white hover:bg-[#b8070f] active:scale-95 shadow-red-900/20'
                : 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
              }`}
          >
            {processingState.status === 'processing' ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={22} className="stroke-[3]" />
                <span>Translate Message</span>
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        {processingState.status === 'success' && (
          <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-center text-neutral-800 animate-bounce">
              <ArrowDown size={32} />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E50914]"></div>
              <div className="flex items-center gap-3 mb-6 text-[#E50914]">
                <div className="p-2.5 bg-[#E50914]/10 rounded-full">
                  <Type size={18} />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">{language} Meaning</span>
              </div>
              <p className="text-2xl text-white leading-relaxed font-semibold">{translation}</p>
            </div>

            <ReplySection language={language} />

            <button
              onClick={() => {
                setInputEnglish('');
                setProcessingState({ status: 'idle' });
              }}
              className="mt-12 w-full py-4 text-neutral-500 font-medium hover:text-white rounded-xl transition-colors text-sm uppercase tracking-widest"
            >
              Translate Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
