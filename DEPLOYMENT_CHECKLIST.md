# Deployment Checklist (Manual Payment System)

## Step 1: Firebase Console Setup
1. **Authentication**:
   - Enable **Email/Password** provider.
   - Enable **Anonymous** provider.
2. **Firestore Rules**: Ensure rules allow read/write for authenticated users (including anonymous).

## Step 2: Frontend Deployment
The frontend is built with Vite.
```bash
npm run build
firebase deploy --only hosting
```

## Step 3: Backend Deployment (Firebase Functions)
The backend handles the monthly credit reset cron job.
**Requirement:** You still need the **Blaze (Pay-as-you-go)** plan for Cloud Functions.

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
cd ..
firebase deploy --only functions
```

## Step 4: Configuration
1. **WhatsApp Number**: Open `components/Paywall.tsx` and update `ADMIN_WHATSAPP_NUMBER` with your actual number.

## Step 5: Verification
1. **Guest Mode**: Open in Incognito. Verify you get 5 credits.
2. **Paywall**: Use up credits (or set to 0 in Firestore). Verify Paywall appears.
3. **Purchase**: Click "Request". Verify WhatsApp opens.
4. **Admin**: Create a test user in Firebase Console (Email: `phone@c3talk.com`, Pass: `test123`).
5. **Login**: Click "Login" on Paywall. Login with Phone/Pass. Verify access.
