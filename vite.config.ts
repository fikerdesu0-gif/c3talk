import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: Set base to './' so all generated asset paths are relative.
  // This prevents "MIME type text/html" errors on Cloudflare/Netlify when files aren't found at root.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});