import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to log usage to Firestore
const logTranslation = async (type: 'audio' | 'text' | 'reply', source: string, target: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, "translations"), {
        userId: user.uid,
        phoneNumber: user.phoneNumber,
        type,
        sourceLanguage: source,
        targetLanguage: target,
        timestamp: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error("Failed to log translation stats", e);
    // Don't block the user if logging fails
  }
};

// Helper to clean JSON string from Markdown backticks
const cleanAndParseJSON = (text: string) => {
  try {
    // Remove ```json ... ``` or just ``` ... ```
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error on text:", text);
    throw new Error("Failed to parse response from AI.");
  }
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part (e.g. "data:audio/mp3;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Transcribes English audio and translates it to the target language.
 */
export const processIncomingAudio = async (
  audioBase64: string,
  mimeType: string,
  targetLang: Language
): Promise<{ transcription: string; translation: string }> => {
  try {
    const prompt = `
      You are an expert translator.
      1. Transcribe the spoken English audio. The audio might be low quality (WhatsApp Voice Note). Do your best to transcribe the meaning accurately.
      2. Translate the transcription into ${targetLang}.
      
      Return strictly a JSON object with this structure:
      {
        "transcription": "English text...",
        "translation": "${targetLang} text..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING, description: "The English transcription of the audio" },
            translation: { type: Type.STRING, description: `The ${targetLang} translation of the transcription` },
          },
          required: ["transcription", "translation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const result = cleanAndParseJSON(text);
    
    // Log to Firebase
    await logTranslation('audio', 'English', targetLang);
    
    return result;
  } catch (error) {
    console.error("Audio processing error:", error);
    throw new Error("Failed to process audio. Ensure the file is valid audio.");
  }
};

/**
 * Translates English text to Target Language.
 */
export const processIncomingText = async (
  text: string,
  targetLang: Language
): Promise<{ translation: string }> => {
  try {
    const prompt = `Translate the following English text into ${targetLang}. Return strictly JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: `Text: "${text}"\n\n${prompt}` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING, description: `The ${targetLang} translation` },
          },
          required: ["translation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response");
    
    const result = cleanAndParseJSON(resultText);

    // Log to Firebase
    await logTranslation('text', 'English', targetLang);

    return result;
  } catch (error) {
    console.error("Text processing error:", error);
    throw new Error("Failed to translate text.");
  }
};

/**
 * Translates Native Language Reply to English.
 */
export const translateReply = async (
  text: string,
  sourceLang: Language
): Promise<{ translation: string }> => {
  try {
    const prompt = `
      Translate the following ${sourceLang} text into clear, professional English suitable for a WhatsApp reply.
      Return strictly JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: `Original (${sourceLang}): "${text}"\n\n${prompt}` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING, description: "The English translation" },
          },
          required: ["translation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response");
    
    const result = cleanAndParseJSON(resultText);
    
    // Log to Firebase
    await logTranslation('reply', sourceLang, 'English');

    return result;
  } catch (error) {
    console.error("Reply translation error:", error);
    throw new Error("Failed to translate reply.");
  }
};