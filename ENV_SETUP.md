# Environment Variables Setup Guide

## Problem
The application was failing with "Gemini API Key is missing" error because:
1. Vite requires environment variables to be prefixed with `VITE_` to be accessible in client-side code
2. The code was using `process.env.API_KEY` instead of `import.meta.env.VITE_GEMINI_API_KEY`
3. No `.env` file existed for local development

## Solution

### 1. Local Development Setup

1. **Copy the `.env.example` file to `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual API keys in `.env`:**
   - Get your Gemini API key from: https://aistudio.google.com/app/apikey
   - Get your Firebase config from Firebase Console > Project Settings > General > Your apps

3. **Example `.env` file:**
   ```env
   VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### 2. Cloudflare Pages Deployment Setup

For Cloudflare Pages, you need to set environment variables in the Cloudflare dashboard:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables (for both Production and Preview):
   - `VITE_GEMINI_API_KEY` = your Gemini API key
   - `VITE_FIREBASE_API_KEY` = your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` = your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` = your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` = your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = your Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID` = your Firebase app ID

4. **Redeploy your application** after adding the environment variables

### 3. Important Notes

- **All environment variables MUST start with `VITE_`** to be accessible in the browser
- The `.env` file is gitignored and should NEVER be committed to version control
- Environment variables are embedded at build time, so you need to rebuild after changing them
- For Cloudflare, make sure to set variables for both "Production" and "Preview" environments

### 4. Verification

After setting up, you should see:
- ✅ No "Gemini API Key is missing" errors in the console
- ✅ Translation features working correctly
- ✅ Firebase authentication and logging working

### 5. Troubleshooting

**Still getting "API Key is missing" error?**
- Make sure you've restarted the dev server after creating `.env`
- Check that variable names are exactly `VITE_GEMINI_API_KEY` (case-sensitive)
- Verify the `.env` file is in the project root directory
- For Cloudflare: Ensure you've redeployed after adding environment variables

**TypeScript errors?**
- The `vite-env.d.ts` file should define all environment variables
- Restart your TypeScript server in VS Code

**Cloudflare deployment not loading?**
- Check the build logs in Cloudflare Pages dashboard
- Verify all environment variables are set correctly
- Make sure the build command is `npm run build` and output directory is `dist`
