import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check for the key using your specific variable name first
  const apiKey = env.GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  // Safety check: Warn if API_KEY is missing during build
  if (!apiKey) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY is missing in the build environment. The app will fail in production.");
  }

  return {
    plugins: [react()],
    // CRITICAL: Set base to '/' for Cloudflare production. Relative paths './' can cause MIME type errors.
    base: '/',
    define: {
      // Inject the API Key into the code. 
      // This maps your GEMINI_API_KEY from Cloudflare to process.env.API_KEY in the React app.
      'process.env.API_KEY': JSON.stringify(apiKey || ""),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});