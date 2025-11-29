import React, { useState, useRef } from 'react';
import { Mic, Upload, FileAudio, RefreshCw, Loader2, Play } from 'lucide-react';
import { Header } from './Header';
import { ReplySection } from './ReplySection';
import { Language, ProcessingState } from '../types';
import { fileToGenerativePart, processIncomingAudio } from '../services/geminiService';

interface VoiceFlowProps {
  language: Language;
  onBack: () => void;
}

export const VoiceFlow: React.FC<VoiceFlowProps> = ({ language, onBack }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
        setProcessingState({ status: 'error', message: 'Please select an audio file.' });
        return;
    }

    setProcessingState({ status: 'processing' });

    try {
      const base64 = await fileToGenerativePart(file);
      const result = await processIncomingAudio(base64, file.type, language);
      
      setTranscription(result.transcription);
      setTranslation(result.translation);
      setProcessingState({ status: 'success' });
    } catch (e) {
        setProcessingState({ status: 'error', message: 'Failed to process audio. Please try again.' });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      <Header title="Voice Message" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto p-6 pb-12 fade-in">
        
        {processingState.status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-[80vh] space-y-8">
             <div className="relative">
                <div className="absolute inset-0 bg-[#E50914] blur-3xl opacity-20 rounded-full"></div>
                <div className="relative w-32 h-32 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[#E50914] mb-4 shadow-2xl">
                    <Mic size={48} />
                </div>
             </div>
             
             <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold">Upload Audio</h3>
                 <p className="text-neutral-500 max-w-[240px] mx-auto">
                   Select the voice note shared from WhatsApp
                 </p>
             </div>

             <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs bg-[#E50914] text-white py-4 rounded-2xl font-semibold text-lg shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3"
             >
                <Upload size={20} className="stroke-[3]" />
                <span>Select Voice Note</span>
             </button>
             <input 
                type="file" 
                accept="audio/*" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
            />
          </div>
        )}

        {processingState.status === 'processing' && (
           <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
              <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
              <p className="text-lg font-medium text-neutral-400">Processing Audio...</p>
           </div>
        )}

        {processingState.status === 'error' && (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 text-center px-6">
                <div className="text-red-500 font-bold text-lg bg-red-500/10 px-6 py-4 rounded-2xl border border-red-500/20">
                    {processingState.message}
                </div>
                <button 
                    onClick={() => setProcessingState({ status: 'idle' })}
                    className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-bold text-white transition-colors"
                >
                    Try Again
                </button>
            </div>
        )}

        {processingState.status === 'success' && (
          <div className="space-y-6 fade-in">
             {/* Source Card */}
             <div className="group bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-neutral-700"></div>
                <div className="flex items-center gap-3 mb-4 text-neutral-400">
                    <div className="p-2 bg-neutral-800 rounded-full">
                        <FileAudio size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">English Transcription</span>
                </div>
                <p className="text-lg text-neutral-200 leading-relaxed font-normal">"{transcription}"</p>
             </div>

             {/* Translation Card */}
             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#E50914]"></div>
                <div className="flex items-center gap-3 mb-4 text-[#E50914]">
                    <div className="p-2 bg-[#E50914]/10 rounded-full">
                        <RefreshCw size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">{language} Translation</span>
                </div>
                <p className="text-2xl text-white leading-relaxed font-semibold">{translation}</p>
             </div>

             <ReplySection language={language} />

             <button 
                onClick={() => setProcessingState({ status: 'idle' })}
                className="mt-8 w-full py-4 text-neutral-500 font-medium hover:text-white rounded-xl transition-colors text-sm uppercase tracking-widest"
             >
                Process Another
             </button>
          </div>
        )}
      </div>
    </div>
  );
};