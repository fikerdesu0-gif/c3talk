# C3Talk Performance Optimization Plan

## Problem Statement
C3Talk is a WhatsApp voice note translation PWA targeting Amharic/Oromo speakers. Users need near-instant transcription and translation for live use cases. The current architecture has several performance bottlenecks:
- 966KB JavaScript bundle (massive, blocks initial render)
- Tailwind CSS loaded from CDN at runtime (render-blocking)
- Firebase SDK fully imported synchronously (heavy, delays auth)
- Audio processing on main thread (UI freezes during conversion)
- No caching of translations (repeated API calls for same content)
- Blocking auth flow before any UI renders
- Synchronous AI client initialization
- OGG→WAV conversion blocking (slow for short audios)

## Critical Issues Identified

### 1. Bundle & Startup Performance
- 966KB bundle includes Firebase (400KB+), OpenRouter API, React, lucide-react icons
- Tailwind CDN script is render-blocking in `<head>`
- No code splitting — entire app loaded upfront
- No preconnect hints for API domains

### 2. AI/Translation Speed
- `aiService.ts`: synchronous retry logic
- No request deduplication or caching for identical translations
- OGG→WAV conversion runs on main thread, blocking UI
- Full audio file read into memory before processing

### 3. Firebase Performance
- Full Firebase SDK imported synchronously (`firebase/auth`, `firebase/firestore`)
- Auth state listener blocks entire app with loading screen
- `initializeUserCredits` runs sequentially after auth, adding latency
- `logTranslation` writes to Firestore on every translation (network latency)

### 4. PWA & Caching Issues
- Service worker only caches `/`, `/index.html`, `/manifest.json`
- No caching of JavaScript bundles or API responses
- No offline translation capability
- Share target processing has 300ms retry delay

### 5. Security Issues
- Firebase config exposed in source (`apiKey` visible) — acceptable for client SDK but should use security rules
- API keys accessed via `import.meta.env` without validation

## Proposed Optimizations

### Phase 1: Critical Path Optimization (Instant Startup)
- Replace Tailwind CDN with build-time CSS
- Install `tailwindcss` as dev dependency
- Generate optimized CSS at build time (~10–20KB vs 400KB+ CDN)
- Code split Firebase SDK
- Dynamic import Firebase auth/firestore
- Show UI immediately, load auth in background
- Add preconnect hints:
  - `generativelanguage.googleapis.com` (legacy)
  - `openrouter.ai`
  - `firestore.googleapis.com`
  - `identitytoolkit.googleapis.com`
- Optimize Vite build config
- Manual chunks for vendor code
- Tree-shake `lucide-react` icons
- Enable minification & compression hints

### Phase 2: AI Call Optimization (Near-Instant Translation)
- Add translation cache
- Cache recent translations in `localStorage`/`IndexedDB`
- Content-hash based lookup before API call
- Instant return for repeated translations
- Move audio conversion to Web Worker
- OGG→WAV conversion off main thread
- UI stays responsive during processing
- Optimize retry logic
- Reduce initial retry delay from 2s to 500ms
- Use parallel fallback (race primary + backup)
- Add request timeout (10s max)
- Stream API responses
- Use streaming for text generation where possible
- Show partial results immediately

### Phase 3: PWA & Caching Improvements
- Enhanced service worker caching
- Cache all static assets (JS, CSS, icons)
- Cache API responses with stale-while-revalidate
- Add translation result caching
- Offline support
- Queue translations when offline
- Show cached results instantly
- Preload critical resources
- Preload main JS chunk
- Preload fonts if any

### Phase 4: Code Quality & Reliability
- Fix React StrictMode double-mount
- `useEffect` cleanup for auth listeners
- Prevent duplicate API calls in dev
- Error boundaries
- Graceful error handling
- Retry UI for failed translations
- Deferred Firestore logging
- Batch translation logs
- Don’t block user flow

### Phase 5: Bundle Size Reduction
- Tree-shake `lucide-react`
- Import only used icons (currently imports entire library)
- Lazy load non-critical components (History, Settings, Paywall)
- Load on navigation
- Optimize Firebase imports
- Import only needed functions
- Use modular SDK properly

## Expected Results
- First paint: <1s (from ~3–4s)
- Time to interactive: <2s (from ~5s)
- Translation latency: <2s for cached, <4s for new (from 5–10s)
- Bundle size: <300KB (from 966KB)
- Offline capable: Yes (currently No)

## Implementation Order
1. Tailwind build-time CSS (immediate win, no risk)
2. Preconnect hints (immediate win, no risk)
3. Translation caching (high impact, low risk)
4. Code splitting (high impact, medium risk)
5. Web Worker for audio (high impact, medium risk)
6. Service worker enhancements (medium impact, low risk)
7. Bundle optimization (medium impact, low risk)
