import React, { useState } from 'react';
import { Type, RefreshCw, Loader2, ClipboardPaste, ArrowDown } from 'lucide-react';
import { Header } from './Header';
import { ReplySection } from './ReplySection';
import { Language, ProcessingState } from '../types';
import { processIncomingText } from '../services/geminiService';

interface TextFlowProps {
  language: Language;
  onBack: () => void;
}

export const TextFlow: React.FC<TextFlowProps> = ({ language, onBack }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [inputEnglish, setInputEnglish] = useState('');
  const [translation, setTranslation] = useState('');

  const handleTranslate = async () => {
    if (!inputEnglish.trim()) return;
    setProcessingState({ status: 'processing' });
    
    try {
      const result = await processIncomingText(inputEnglish, language);
      setTranslation(result.translation);
      setProcessingState({ status: 'success' });
    } catch (e) {
      setProcessingState({ status: 'error', message: 'Translation failed.' });
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
      <Header title="Text Message" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto p-6 pb-12 fade-in">
        
        {/* Input Section */}
        <div className="space-y-4">
           <label className="block text-neutral-500 text-sm font-semibold tracking-wide ml-1 uppercase">
             Original Message
           </label>
           
           <div className="relative group">
             <textarea 
                value={inputEnglish}
                onChange={(e) => setInputEnglish(e.target.value)}
                placeholder="Paste English text here..."
                className="w-full h-40 p-5 bg-neutral-900 border border-neutral-800 rounded-3xl text-xl text-white placeholder:text-neutral-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none resize-none transition-all duration-300"
             />
             {!inputEnglish && (
                 <button 
                    onClick={handlePaste}
                    className="absolute bottom-5 right-5 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg"
                 >
                    <ClipboardPaste size={16} />
                    Paste
                 </button>
             )}
           </div>

           <button
             onClick={handleTranslate}
             disabled={!inputEnglish.trim() || processingState.status === 'processing'}
             className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
               inputEnglish.trim()
                ? 'bg-[#E50914] text-white hover:bg-[#b8070f] active:scale-95 shadow-red-900/20'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
             }`}
           >
             {processingState.status === 'processing' ? (
                <Loader2 className="animate-spin" />
             ) : (
                <>
                  <RefreshCw size={20} className="stroke-[3]" />
                  <span>Translate</span>
                </>
             )}
           </button>
        </div>

        {/* Output Section */}
        {processingState.status === 'success' && (
           <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-8 duration-500">
               <div className="flex justify-center text-neutral-700">
                  <ArrowDown size={24} />
               </div>

               <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#E50914]"></div>
                <div className="flex items-center gap-3 mb-4 text-[#E50914]">
                    <div className="p-2 bg-[#E50914]/10 rounded-full">
                        <Type size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">{language} Meaning</span>
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