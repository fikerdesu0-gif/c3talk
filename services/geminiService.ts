
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Language } from "../types";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { deductCredits, getUserCredits } from "./creditService";
import { trackEvent } from "./analytics";
import { DISABLE_CREDIT_DEDUCTION } from "../config";

// Initialize Gemini Client Lazily
// This prevents the app from crashing on load if the API key is missing (e.g. during build or initial setup)
let aiInstance: GoogleGenAI | null = null;
let fallbackCooldownUntil = 0;

const getResponseText = async (resp: any): Promise<string | null> => {
  try {
    if (!resp) return null;
    if (typeof resp.text === "function") {
      const t = await resp.text();
      if (t && String(t).trim()) return String(t);
    }
    if (typeof resp.text === "string") {
      const t = resp.text;
      if (t && String(t).trim()) return String(t);
    }
    const c = resp.candidates?.[0]?.content;
    const parts = Array.isArray(c?.parts) ? c.parts : (Array.isArray(c) ? c : []);
    for (const p of parts) {
      if (typeof p?.text === "string" && p.text.trim()) return String(p.text);
    }
    return null;
  } catch {
    return null;
  }
};

const getAI = () => {
  if (!aiInstance) {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY;
    if (!key) {
      throw new Error("Gemini API key is missing — set VITE_GEMINI_API_KEY.");
    }
    const fp = `${key.slice(0, 6)}...${key.slice(-4)}`;
    console.info(`Initializing Gemini client (key: ${fp})`);
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

// Retry Helper for 503/Overloaded errors
const withRetry = async <T>(operation: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.code === 429;
      const isOverloaded = error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded');
      if (is429) {
        throw error;
      }
      if (isOverloaded && i < retries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Gemini API busy (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("API Request failed after retries");
};

const shouldFallback = (error: any): boolean => {
  try {
    if (!error) return true;
    const msg = String(error.message || "").toLowerCase();
    const status = error.status || error.code;
    if (!msg && !status) return true;
    if (status === 429 || status === 503 || status === 500) return true;
    if (msg.includes("rate") || msg.includes("quota") || msg.includes("overload") || msg.includes("busy") || msg.includes("timeout")) return true;
    if (msg.includes("api key is missing")) return true;
    return false;
  } catch {
    return true;
  }
};

const getOpenRouterKey = (): string | null => {
  const env = (import.meta as any).env || {};
  const key = env.VITE_OPENROUTER_API_KEY || env.VITE_OR_API_KEY || null;
  return key;
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

const extractOpenRouterText = (json: any): string | null => {
  if (!json) return null;
  if (typeof json.output_text === "string" && json.output_text.trim()) return json.output_text;
  if (json.response && typeof json.response.output_text === "string" && json.response.output_text.trim()) return json.response.output_text;
  if (Array.isArray(json.output)) {
    for (const item of json.output) {
      const c = item?.content;
      if (!c) continue;
      if (typeof c === "string" && c.trim()) return c;
      if (Array.isArray(c)) {
        const part = c.find((p: any) => p?.text || p?.type === "text");
        if (part?.text && String(part.text).trim()) return String(part.text);
      }
    }
  }
  if (Array.isArray(json.choices) && json.choices[0]?.message) {
    const content = json.choices[0].message.content;
    if (typeof content === "string" && content.trim()) return content;
    if (Array.isArray(content)) {
      const t = content.find((p: any) => p?.text || p?.type === "text");
      if (t?.text && String(t.text).trim()) return String(t.text);
    }
  }
  if (json.data && Array.isArray(json.data) && json.data[0]?.content) {
    const c = json.data[0].content;
    if (typeof c === "string" && c.trim()) return c;
    if (Array.isArray(c)) {
      const t = c.find((p: any) => p?.text || p?.type === "text");
      if (t?.text && String(t.text).trim()) return String(t.text);
    }
  }
  if (typeof json.text === "string" && json.text.trim()) return json.text;
  return null;
};

const callOpenRouterText = async (prompt: string): Promise<string> => {
  const key = getOpenRouterKey();
  if (!key) throw new Error("OpenRouter API key is missing — set VITE_OPENROUTER_API_KEY.");
  const url = "https://openrouter.ai/api/v1/responses";
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
  const body = {
    model: "google/gemini-2.5-flash",
    max_output_tokens: 256,
    temperature: 0,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt }
        ]
      }
    ]
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${t}`);
  }
  const json = await res.json();
  const text = extractOpenRouterText(json);
  if (!text) throw new Error("Invalid response from OpenRouter");
  return text;
};

const callOpenRouterAudio = async (audioBase64: string, mimeType: string, prompt: string): Promise<string> => {
  const key = getOpenRouterKey();
  if (!key) throw new Error("OpenRouter API key is missing — set VITE_OPENROUTER_API_KEY.");
  const url = "https://openrouter.ai/api/v1/responses";
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
  const format = mapMimeToFormat(mimeType);
  const body = {
    model: "google/gemini-2.5-flash",
    max_output_tokens: 512,
    temperature: 0,
    input: [
      {
        role: "user",
        content: [
          { type: "input_audio", input_audio: { format, data: audioBase64 } }
        ]
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt }
        ]
      }
    ]
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${t}`);
  }
  const json = await res.json();
  const text = extractOpenRouterText(json);
  if (!text) throw new Error("Invalid response from OpenRouter");
  return text;
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

// Helper to clean JSON string from Markdown backticks
const cleanAndParseJSON = (text: string) => {
  let jsonString = text;
  try {
    // 1. Attempt to find the JSON object within markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    } else {
      // 2. If not in markdown, try to find the first and last curly braces
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = text.substring(firstBrace, lastBrace + 1);
      } else {
        // 3. If still not found, try to find the first and last square brackets (for array JSON)
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          jsonString = text.substring(firstBracket, lastBracket + 1);
        }
      }
    }

    // Clean up any remaining backticks or markdown that might have been missed
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    // Attempt to parse the extracted string
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    console.error("JSON Parse Error on text:", jsonString, "Original text:", text, "Error:", e);
    throw new Error("Failed to parse response from AI. Original text: " + text);
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
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Check credits
    if (!DISABLE_CREDIT_DEDUCTION) {
      const credits = await getUserCredits(user.uid);
      if (credits < 1) {
        throw new Error("Insufficient credits. Please purchase a plan.");
      }
    }

    const prompt = `
      You are an expert translator.
      1. Transcribe the spoken English audio. The audio might be low quality (WhatsApp Voice Note) or contain noise. Do your best to transcribe the meaning accurately.
      2. Translate the transcription into ${targetLang}.
      
      Return strictly a JSON object with this structure:
      {
        "transcription": "English text...",
        "translation": "${targetLang} text..."
      }
    `;
    let text: string | null = null;
    if (Date.now() < fallbackCooldownUntil) {
      try {
        text = await callOpenRouterAudio(audioBase64, mimeType, prompt);
      } catch (err) {
        console.error("OpenRouter audio call failed during cooldown", err);
        // If backup fails, try primary once
      }
    }
    try {
      const ai = getAI();
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
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
          maxOutputTokens: 512,
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
      }));
      text = await getResponseText(response);
    } catch (err: any) {
      if (shouldFallback(err)) {
        const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || '';
        const fp = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : 'unknown';
        console.warn(`Primary provider failed (key: ${fp}), falling back to OpenRouter for audio.`, err);
        trackEvent('ai_fallback', 'ai', 'audio');
        try {
          text = await callOpenRouterAudio(audioBase64, mimeType, prompt);
          fallbackCooldownUntil = Date.now() + 60_000;
        } catch (orErr: any) {
          const m = String(orErr?.message || "").toLowerCase();
          const is402 = m.includes('code":402') || m.includes('requires at least $0.50') || m.includes('balance');
          if (is402) {
            fallbackCooldownUntil = 0;
            for (let i = 0; i < 3 && !text; i++) {
              try {
                const ai2 = getAI();
                const resp2 = await ai2.models.generateContent({
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
                    maxOutputTokens: 512,
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        transcription: { type: Type.STRING },
                        translation: { type: Type.STRING },
                      },
                      required: ["transcription", "translation"]
                    }
                  }
                });
                text = await getResponseText(resp2);
              } catch (e2) {
                const delay = 3000 * Math.pow(2, i);
                await new Promise(r => setTimeout(r, delay));
              }
            }
            if (!text) throw orErr;
          } else {
            throw orErr;
          }
        }
      } else {
        throw err;
      }
    }
    if (!text) throw new Error("No response from AI provider");
    const result = cleanAndParseJSON(text);

    if (!result.translation || !String(result.translation).trim()) {
      try {
        const recovered = await callOpenRouterAudio(audioBase64, mimeType, prompt);
        const recoveredJson = cleanAndParseJSON(recovered);
        if (recoveredJson?.translation && String(recoveredJson.translation).trim()) {
          result.translation = recoveredJson.translation;
        }
      } catch {}
    }

    // Log to Firebase
    logTranslation('audio', 'English', targetLang, result.transcription, result.translation);

    // Deduct Credit
    await deductCredits(user.uid, 1);

    return result;
  } catch (error) {
    console.error("Audio processing error:", error);
    throw error; // Re-throw to handle in UI
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
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Check credits
    const credits = await getUserCredits(user.uid);
    if (credits < 0.25) {
      throw new Error("Insufficient credits. Please purchase a plan.");
    }

    const prompt = `Translate the following English text into ${targetLang}. Return strictly JSON.`;
    let resultText: string | null = null;
    if (Date.now() < fallbackCooldownUntil) {
      try {
        resultText = await callOpenRouterText(`Text: "${text}"\n\n${prompt}`);
      } catch (err) {
        console.error("OpenRouter text call failed during cooldown", err);
        // If backup fails, try primary once
      }
    }
    try {
      const ai = getAI();
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: `Text: "${text}"\n\n${prompt}` }] },
        config: {
          maxOutputTokens: 256,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING, description: `The ${targetLang} translation` },
            },
            required: ["translation"]
          }
        }
      }));
      resultText = await getResponseText(response);
    } catch (err: any) {
      if (shouldFallback(err)) {
        const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || '';
        const fp = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : 'unknown';
        console.warn(`Primary provider failed (key: ${fp}), falling back to OpenRouter for text.`, err);
        trackEvent('ai_fallback', 'ai', 'text');
        resultText = await callOpenRouterText(`Text: "${text}"\n\n${prompt}`);
        fallbackCooldownUntil = Date.now() + 60_000;
      } else {
        throw err;
      }
    }
    if (!resultText) throw new Error("No response");
    let result = cleanAndParseJSON(resultText);

    // Ensure non-empty translation
    if (!result.translation || !String(result.translation).trim()) {
      try {
        const recovered = await callOpenRouterText(`Text: "${text}"\n\n${prompt}`);
        const recoveredJson = cleanAndParseJSON(recovered);
        if (recoveredJson?.translation && String(recoveredJson.translation).trim()) {
          result.translation = recoveredJson.translation;
        }
      } catch {}
    }
    if (!result.translation || !String(result.translation).trim()) {
      try {
        const ai2 = getAI();
        const resp2 = await ai2.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: `Text: "${text}"\n\n${prompt}` }] },
          config: {
            maxOutputTokens: 256,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: { translation: { type: Type.STRING } },
              required: ["translation"]
            }
          }
        });
        const t2 = await getResponseText(resp2);
        const j2 = t2 ? cleanAndParseJSON(t2) : null;
        if (j2?.translation && String(j2.translation).trim()) {
          result.translation = j2.translation;
        }
      } catch {}
    }
    if (!result.translation || !String(result.translation).trim()) {
      result.translation = text;
    }

    // Log to Firebase
    logTranslation('text', 'English', targetLang, text, result.translation);

    await deductCredits(user.uid, 0.25);

    return result;
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('insufficient credits')) {
      throw error;
    }
    // Guarantee a non-empty result for UX
    return { translation: text };
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
    let resultText: string | null = null;
    if (Date.now() < fallbackCooldownUntil) {
      try {
        resultText = await callOpenRouterText(`Original (${sourceLang}): "${text}"\n\n${prompt}`);
      } catch (err) {
        console.error("OpenRouter reply call failed during cooldown", err);
      }
    }
    try {
      const ai = getAI();
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: `Original (${sourceLang}): "${text}"\n\n${prompt}` }] },
        config: {
          maxOutputTokens: 256,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING, description: "The English translation" },
            },
            required: ["translation"]
          }
        }
      }));
      resultText = response.text || null;
    } catch (err: any) {
      if (shouldFallback(err)) {
        const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || '';
        const fp = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : 'unknown';
        console.warn(`Primary provider failed (key: ${fp}), falling back to OpenRouter for reply.`, err);
        trackEvent('ai_fallback', 'ai', 'reply');
        resultText = await callOpenRouterText(`Original (${sourceLang}): "${text}"\n\n${prompt}`);
        fallbackCooldownUntil = Date.now() + 60_000;
      } else {
        throw err;
      }
    }
    if (!resultText) throw new Error("No response");
    let result = cleanAndParseJSON(resultText);
    if (!result.translation || !String(result.translation).trim()) {
      try {
        const recovered = await callOpenRouterText(`Original (${sourceLang}): "${text}"\n\n${prompt}`);
        const recoveredJson = cleanAndParseJSON(recovered);
        if (recoveredJson?.translation && String(recoveredJson.translation).trim()) {
          result.translation = recoveredJson.translation;
        }
      } catch {}
    }
    if (!result.translation || !String(result.translation).trim()) {
      result.translation = text;
    }

    // Log to Firebase
    logTranslation('reply', sourceLang, 'English', text, result.translation);

    return result;
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('insufficient credits')) {
      throw error;
    }
    // Guarantee a non-empty result for UX
    return { translation: text };
  }
};

 
