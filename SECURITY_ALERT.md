# Security Alert: API Key Leaked

## What Happened
Your Gemini API key was detected as leaked and has been disabled by Google. This likely happened because the `.env` file was committed to your Git repository before it was added to `.gitignore`.

## Immediate Actions Required

### 1. Get a New API Key ✅ DO THIS FIRST
1. Go to: https://aistudio.google.com/app/apikey
2. **Delete the old leaked key** (it's already disabled anyway)
3. **Create a new API key**
4. **Copy the new key**

### 2. Update Your .env File
1. Open `.env` in your editor
2. Replace the old key with the new one:
   ```
   VITE_GEMINI_API_KEY=your_new_key_here
   ```
3. Save the file
4. Restart the dev server (Ctrl+C, then `npm run dev`)

### 3. Remove .env from Git History (IMPORTANT!)

The `.env` file was committed to Git, which is how it leaked. You need to remove it from Git history:

**Option A: If you haven't pushed to a remote repository (GitHub, etc.)**
```bash
# Remove .env from the last commit
git rm --cached .env
git commit --amend -m "Remove .env file from tracking"
```

**Option B: If you've pushed to GitHub/remote (MORE SERIOUS)**
```bash
# Remove .env from all Git history
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

# Force push to remote (WARNING: This rewrites history!)
git push origin --force --all
```

**⚠️ WARNING**: Option B rewrites Git history. If others are working on this repo, coordinate with them first!

### 4. Verify .env is Gitignored
Check that `.env` is in your `.gitignore` file (it should be, I added it):
```bash
cat .gitignore | grep .env
```

You should see:
```
.env
.env.local
.env.*.local
```

### 5. Update Cloudflare Deployment
1. Go to Cloudflare Pages dashboard
2. Settings > Environment Variables
3. Update `VITE_GEMINI_API_KEY` with your **new** API key
4. Redeploy

## How to Prevent This in the Future

### ✅ Best Practices
1. **Never commit `.env` files** - Always add them to `.gitignore` BEFORE committing
2. **Use `.env.example`** - Commit a template with placeholder values
3. **Scan before committing**: Use `git status` to check what you're committing
4. **Use Git hooks**: Set up pre-commit hooks to prevent committing sensitive files
5. **Restrict API keys**: In Google AI Studio, restrict keys to specific domains

### 🔒 Restrict Your New API Key
After creating the new key:
1. Go to Google AI Studio > API Keys
2. Click on your new key
3. Add restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your domains:
     - `http://localhost:5173/*`
     - `http://localhost:5174/*`
     - `https://your-cloudflare-domain.pages.dev/*`

This prevents the key from being used on other websites even if it leaks again.

## Verification Checklist

After completing the steps above:
- [ ] New API key created
- [ ] `.env` file updated with new key
- [ ] Dev server restarted
- [ ] `.env` removed from Git history
- [ ] `.env` is in `.gitignore`
- [ ] New key restricted to your domains
- [ ] Cloudflare environment variables updated
- [ ] Application working without 403 errors

## If You've Pushed to GitHub

If your repository is public on GitHub:
1. The leaked key is now public and indexed by search engines
2. Bots scan GitHub for API keys constantly
3. You MUST remove it from Git history (see Option B above)
4. Consider making your repository private if it contains sensitive code

## Need Help?

If you're unsure about any of these steps, let me know and I can guide you through them!
