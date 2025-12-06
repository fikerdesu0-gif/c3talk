import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, FileAudio, RefreshCw, Loader2, Play } from 'lucide-react';
import { Header } from './Header';
import { ReplySection } from './ReplySection';
import { Language, ProcessingState } from '../types';
import { fileToGenerativePart, processIncomingAudio } from '../services/geminiService';

interface VoiceFlowProps {
  language: Language;
  onBack: () => void;
  autoLoadShared?: boolean;
  credits: number | null;
}

export const VoiceFlow: React.FC<VoiceFlowProps> = ({ language, onBack, autoLoadShared, credits }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoLoadShared) {
      loadSharedFile();
    }
  }, [autoLoadShared]);

  const loadSharedFile = async () => {
    setProcessingState({ status: 'processing', message: 'Loading shared file...' });
    try {
      const cache = await caches.open('share-cache');
      const response = await cache.match('shared-file');

      if (response) {
        const blob = await response.blob();
        // Try to detect extension from blob type or fallback
        let fileName = "shared_audio";
        // WhatsApp shares often come as application/octet-stream or audio/opus
        if (blob.type.includes('ogg') || blob.type.includes('opus')) fileName += ".opus";
        else if (blob.type.includes('mp4') || blob.type.includes('m4a')) fileName += ".m4a";
        else fileName += ".mp3";

        const file = new File([blob], fileName, { type: blob.type });

        await processFile(file);

        // Clean up cache
        await cache.delete('shared-file');
      } else {
        setProcessingState({ status: 'idle' });
      }
    } catch (e) {
      console.error("Error loading shared file", e);
      setProcessingState({ status: 'error', message: 'Could not load shared file.' });
    }
  };

  const getMimeType = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    // Strict mapping for Gemini compatibility
    switch (ext) {
      case 'mp3': return 'audio/mp3';
      case 'wav': return 'audio/wav';
      case 'aac': return 'audio/aac';
      case 'flac': return 'audio/flac';
      // Gemini treats ogg/opus similarly
      case 'ogg':
      case 'opus': return 'audio/ogg';
      case 'm4a':
      case 'mp4': return 'audio/mp4';
      case 'amr': return 'audio/amr';
      default:
        // If file.type is valid audio, use it, otherwise default to mp3
        return file.type.startsWith('audio/') ? file.type : 'audio/mp3';
    }
  };

  const processFile = async (file: File) => {
    // Basic validation
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|opus|amr|aac)$/i)) {
      setProcessingState({ status: 'error', message: 'Please select a valid audio file.' });
      return;
    }

    setProcessingState({ status: 'processing', message: 'Analyzing Voice Note...' });

    try {
      const base64 = await fileToGenerativePart(file);
      const mimeType = getMimeType(file);

      console.log(`Processing file: ${file.name} as ${mimeType}`);

      const result = await processIncomingAudio(base64, mimeType, language);

      setTranscription(result.transcription);
      setTranslation(result.translation);
      setProcessingState({ status: 'success' });
    } catch (e: any) {
      console.error("Processing failed", e);
      setProcessingState({ status: 'error', message: e.message || 'Failed to process audio.' });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
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
              accept="audio/*,.opus,.ogg,.m4a,.mp3,.wav,.aac"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {processingState.status === 'processing' && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
            <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
            <p className="text-lg font-medium text-neutral-400">{processingState.message || 'Processing...'}</p>
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