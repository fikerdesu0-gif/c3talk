# Cloudflare Pages Deployment Guide

## The Problem You Were Experiencing

**Error**: `Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"`

**Root Cause**: This happens when Cloudflare Pages serves your `index.html` file instead of JavaScript modules. This was caused by:
1. `base: './'` in `vite.config.ts` creating relative paths that confused Cloudflare's routing
2. Missing `_redirects` file for proper SPA (Single Page Application) routing

## What I Fixed

### 1. ✅ Created `public/_redirects`
This file tells Cloudflare to redirect all requests to `index.html` (required for SPAs):
```
/* /index.html 200
```

### 2. ✅ Simplified `vite.config.ts`
Removed:
- `base: './'` - This was causing path resolution issues
- `define` block - No longer needed since we use `import.meta.env`
- `loadEnv` - Vite handles this automatically with `VITE_` prefix

## Cloudflare Pages Setup

### Build Configuration

When setting up your Cloudflare Pages project, use these settings:

**Framework preset**: `Vite`

**Build command**: 
```bash
npm run build
```

**Build output directory**: 
```
dist
```

**Root directory**: 
```
/
```

### Environment Variables

In Cloudflare Pages dashboard, go to **Settings** > **Environment Variables** and add:

#### Production Environment:
```
VITE_GEMINI_API_KEY=your_new_api_key_here
VITE_FIREBASE_API_KEY=AIzaSyD9v0QKWRtMVaHHfhho5OcVYkCjOAxUya4
VITE_FIREBASE_AUTH_DOMAIN=c3talk-b19ef.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=c3talk-b19ef
VITE_FIREBASE_STORAGE_BUCKET=c3talk-b19ef.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=434910550026
VITE_FIREBASE_APP_ID=1:434910550026:web:de814a9b6d16d10bc327f3
```

#### Preview Environment:
Add the same variables for the Preview environment as well.

**⚠️ IMPORTANT**: Use your **NEW** Gemini API key (not the leaked one)!

### Node.js Version

Set the Node.js version in Cloudflare Pages:
- Go to **Settings** > **Environment variables**
- Add: `NODE_VERSION` = `18` (or `20`)

## Deployment Steps

### Option 1: Deploy via Git (Recommended)

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Fix Cloudflare Pages deployment configuration"
   git push
   ```

2. **Cloudflare will automatically rebuild** and deploy

### Option 2: Manual Deployment

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to Cloudflare Pages via the dashboard

## Testing the Build Locally

Before deploying, test the production build locally:

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

This will start a local server serving the production build. Test it at `http://localhost:4173/`

## Verification Checklist

After deployment, verify:
- [ ] No MIME type errors in browser console
- [ ] All JavaScript modules load correctly
- [ ] Environment variables are accessible (check with test-env.html)
- [ ] Firebase authentication works
- [ ] Gemini API calls work (no 403 errors)
- [ ] All routes work correctly (SPA routing)

## Common Issues & Solutions

### Issue: Still getting MIME type errors
**Solution**: 
- Clear Cloudflare cache: Settings > Caching > Purge Cache
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Environment variables not working
**Solution**:
- Verify all variables start with `VITE_`
- Check they're set in BOTH Production and Preview environments
- Redeploy after adding variables (they're embedded at build time)

### Issue: 404 on page refresh
**Solution**: 
- Verify `public/_redirects` file exists
- Ensure it's being copied to the `dist` folder during build

### Issue: Firebase errors
**Solution**:
- Verify all `VITE_FIREBASE_*` variables are set correctly
- Check Firebase console for authorized domains
- Add your Cloudflare Pages domain to Firebase authorized domains

## Firebase Authorized Domains

Don't forget to add your Cloudflare Pages domain to Firebase:

1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add your domain: `your-project.pages.dev`
3. Also add any custom domains you're using

## Custom Domain Setup (Optional)

If you want to use a custom domain:
1. Go to Cloudflare Pages > Custom domains
2. Add your domain
3. Update DNS records as instructed
4. Add the custom domain to Firebase authorized domains

## Monitoring

After deployment, monitor:
- **Cloudflare Pages Dashboard**: Check build logs for errors
- **Browser Console**: Check for runtime errors
- **Network Tab**: Verify all assets load with correct MIME types

## Need Help?

If you encounter issues:
1. Check Cloudflare Pages build logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test the production build locally first

---

**Last Updated**: After fixing MIME type errors and SPA routing
