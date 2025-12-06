# Manual Payment & Subscription Guide

## 1. User Flow
1. **Guest Mode**: New users get 5 free credits (linked to their device).
2. **Paywall**: Once credits run out, they see the Paywall.
3. **Request**: They fill a form and send you a WhatsApp message.
4. **Payment**: You confirm payment (133 AED/year).
5. **Account Creation**: You create their account in Firebase.
6. **Login**: User logs in with Phone + Password to access their 100 monthly credits.

## 2. Admin Workflow (Creating a Paid Account)

Since users pay manually, you must create their account in the **Firebase Console**.

### Step 1: Create User in Authentication
1. Go to **Firebase Console** > **Authentication** > **Users**.
2. Click **Add user**.
3. **Email**: Enter their phone number as an email:
   `971501234567@c3talk.com` (Remove `+`, use country code).
4. **Password**: Create a temporary password (e.g., `c3talk2025`).
5. Click **Add user**.
6. Copy the **User UID** of the new user.

### Step 2: Notify User
Reply on WhatsApp:
> "Your account is active!
> Login with:
> Phone: +971 50 123 4567
> Password: c3talk2025"

### Step 3: Automatic Account Setup (Happens Automatically)
When the user logs in for the first time, the app will **automatically** detect they are a Premium User and create their database record with the following fields:

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `balance` | number | `100` | Monthly credits. |
| `isPremium` | boolean | `true` | Enables premium features. |
| `hasActiveSubscription` | boolean | `true` | Enables monthly reset. |
| `subscriptionStatus` | string | `"active"` | |
| `subscriptionStartDate` | timestamp | *(Current Time)* | |
| `subscriptionEndDate` | timestamp | *(1 year from now)* | |
| `phoneNumber` | string | `+971501234567` | Extracted from email. |
| `type` | string | `"premium"` | Identifies paid users. |

You do **NOT** need to create this manually. The app handles it.

## 3. Testing & Debugging

### How to Find Your User ID
1. Open the app in your browser.
2. Open Developer Tools (F12) > Console.
3. Look for the log: `✅ Current User ID: ...`

### How to Manually Set Balance to 0 (To Test Paywall)
1. Copy your **User ID** from the console.
2. Go to **Firebase Console** > **Firestore Database**.
3. Go to the `users` collection.
4. Search for your User ID (or browse to find it).
5. Click on the document.
6. Find the `balance` field.
7. Change the value to `0`.
8. Click **Update**.
9. The app should immediately show the Paywall.

## 4. Monthly Credit Reset
The Cloud Function (`monthlyCreditsReset`) runs on the **1st of every month**.
- It finds all users with `hasActiveSubscription: true`.
- It resets their `balance` to **100 credits**.
