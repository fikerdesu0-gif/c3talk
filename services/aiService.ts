import { Language } from "../types";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { deductCredits, getUserCredits } from "./creditService";
import { trackEvent } from "./analytics";
import { DISABLE_CREDIT_DEDUCTION } from "../config";

const getOpenRouterKey = (): string | null => {
  const env = (import.meta as any).env || {};
  return env.VITE_OPENROUTER_API_KEY || env.VITE_OR_API_KEY || null;
};

const mapMimeToFormat = (mime: string): string => {
  const m = (mime || "").toLowerCase();
  if (m.includes("wav")) return "wav";
  if (m.includes("mp3")) return "mp3";
  if (m.includes("ogg") || m.includes("opus")) return "ogg";
  if (m.includes("m4a") || m.includes("mp4")) return "mp4";
  if (m.includes("aac")) return "aac";
  if (m.includes("flac")) return "flac";
  if (m.includes("amr")) return "amr";
  return "mp3";
};

const validateJsonResponse = (json: any, schema: { transcription?: boolean, translation: boolean }): any => {
  if (!json || typeof json !== 'object') {
    throw new Error("Invalid JSON response: not an object");
  }
  if (schema.transcription && typeof json.transcription !== 'string') {
    throw new Error("Invalid JSON response: missing or invalid 'transcription'");
  }
  if (schema.translation && typeof json.translation !== 'string') {
    throw new Error("Invalid JSON response: missing or invalid 'translation'");
  }
  return json;
};

const extractOpenRouterText = (json: any, schema: { transcription?: boolean, translation: boolean }): any => {
  if (!json) throw new Error("Empty OpenRouter response");

  let structuredResponse: any = null;

  if (json.output_text && typeof json.output_text === 'object') {
    structuredResponse = json.output_text;
  } else if (json.response && json.response.output_text && typeof json.response.output_text === 'object') {
    structuredResponse = json.response.output_text;
  } else if (json.output && Array.isArray(json.output)) {
    for (const item of json.output) {
      if (item?.content && typeof item.content === 'object') {
        structuredResponse = item.content;
        break;
      } else if (item?.content && typeof item.content === 'string') {
        try {
          structuredResponse = JSON.parse(item.content);
          break;
        } catch {}
      }
    }
  } else if (json.choices && Array.isArray(json.choices) && json.choices[0]?.message?.content) {
    const content = json.choices[0].message.content;
    if (typeof content === 'object') {
      structuredResponse = content;
    } else if (typeof content === 'string') {
      try {
        structuredResponse = JSON.parse(content);
      } catch {}
    }
  } else if (json.data && Array.isArray(json.data) && json.data[0]?.content) {
    const content = json.data[0].content;
    if (typeof content === 'object') {
      structuredResponse = content;
    } else if (typeof content === 'string') {
      try {
        structuredResponse = JSON.parse(content);
      } catch {}
    }
  } else if (json.text && typeof json.text === 'string') {
    try {
      structuredResponse = JSON.parse(json.text);
    } catch {}
  }

  if (!structuredResponse) {
    throw new Error("No structured JSON found in OpenRouter response");
  }

  return validateJsonResponse(structuredResponse, schema);
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Retrying after error (${retries} retries left):`, error);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

const callOpenRouter = async (body: any, schema: { transcription?: boolean, translation: boolean }): Promise<any> => {
  const key = getOpenRouterKey();
  if (!key) throw new Error("OpenRouter API key is missing — set VITE_OPENROUTER_API_KEY.");
  
  const url = "https://openrouter.ai/api/v1/chat/completions"; // Corrected URL for chat completions
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
  };

  try {
    if (typeof window !== "undefined") {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "C3Talk";
    }
  } catch {}

  const res = await fetch(url, { 
    method: "POST", 
    headers, 
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001", // Using a reliable stable model
      temperature: 0,
      response_format: { type: "json_object" },
      ...body
    }) 
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${t}`);
  }

  const json = await res.json();
  return extractOpenRouterText(json, schema);
};

// Helper to log usage to Firestore
const logTranslation = async (type: 'audio' | 'text' | 'reply', source: string, target: string, original: string, translated: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const docData: any = {
        userId: user.uid,
        type,
        sourceLanguage: source,
        targetLanguage: target,
        original: original || '',
        translated: (translated && String(translated).trim()) ? translated : (original || ''),
        timestamp: serverTimestamp(),
        lastUsed: serverTimestamp(),
      };

      if (user.phoneNumber) {
        docData.phoneNumber = user.phoneNumber;
      }

      await addDoc(collection(db, "translations"), docData);
    }
  } catch (e) {
    console.error("Failed to log translation stats", e);
  }
};

// Helper to convert file to base64
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Transcribes English audio and translates it to the target language via OpenRouter.
 */
export const processIncomingAudio = async (
  audioBase64: string,
  mimeType: string,
  targetLang: Language
): Promise<{ transcription: string; translation: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    if (!DISABLE_CREDIT_DEDUCTION) {
      const credits = await getUserCredits(user.uid);
      if (credits < 1) {
        throw new Error("Insufficient credits. Please purchase a plan.");
      }
    }

    const format = mapMimeToFormat(mimeType);
    const prompt = `
      You are an expert translator.
      1. Transcribe the spoken English audio accurately.
      2. Translate the transcription into ${targetLang}.
      
      Return strictly a JSON object:
      {
        "transcription": "English text...",
        "translation": "${targetLang} text..."
      }
    `;

    const body = {
      max_output_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "input_audio", 
              input_audio: { 
                data: audioBase64,
                format: format 
              } 
            }
          ]
        }
      ]
    };

    const result = await withRetry(() => callOpenRouter(body, { transcription: true, translation: true }));

    logTranslation('audio', 'English', targetLang, result.transcription, result.translation);
    await deductCredits(user.uid, 1);
    trackEvent('ai_request', 'ai', 'audio');

    return result;
  } catch (error) {
    console.error("Audio processing error:", error);
    throw error;
  }
};

/**
 * Translates English text to Target Language via OpenRouter.
 */
export const processIncomingText = async (
  text: string,
  targetLang: Language
): Promise<{ translation: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const credits = await getUserCredits(user.uid);
    if (credits < 0.25) {
      throw new Error("Insufficient credits. Please purchase a plan.");
    }

    const prompt = `Translate the following English text into ${targetLang}. Return strictly JSON with a "translation" field. Text: "${text}"`;
    
    const body = {
      max_output_tokens: 256,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }]
        }
      ]
    };

    const result = await withRetry(() => callOpenRouter(body, { translation: true }));

    logTranslation('text', 'English', targetLang, text, result.translation);
    await deductCredits(user.uid, 0.25);
    trackEvent('ai_request', 'ai', 'text');

    return result;
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('insufficient credits')) throw error;
    console.error("Text translation error:", error);
    return { translation: text };
  }
};

/**
 * Translates Native Language Reply to English via OpenRouter.
 */
export const translateReply = async (
  text: string,
  sourceLang: Language
): Promise<{ translation: string }> => {
  try {
    const prompt = `Translate the following ${sourceLang} text into clear, professional English suitable for a WhatsApp reply. Return strictly JSON with a "translation" field. Text: "${text}"`;
    
    const body = {
      max_output_tokens: 256,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }]
        }
      ]
    };

    const result = await withRetry(() => callOpenRouter(body, { translation: true }));

    logTranslation('reply', sourceLang, 'English', text, result.translation);
    trackEvent('ai_request', 'ai', 'reply');

    return result;
  } catch (error: any) {
    console.error("Reply translation error:", error);
    return { translation: text };
  }
};
