# C3TALK - Firestore Security Rules

## Current Issue
You're getting "Missing or insufficient permissions" errors because Firestore security rules need to be configured.

## Solution

Go to your Firebase Console and update your Firestore Security Rules:

1. Visit: https://console.firebase.google.com/project/c3talk-b19ef/firestore/rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to write their own translation logs
    match /translations/{document} {
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null 
                  && resource.data.userId == request.auth.uid;
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"

## What This Does
- Allows authenticated users to create translation logs with their own userId
- Allows users to read only their own translation logs
- Denies all other access for security

## Note
The app will continue to work even if logging fails (we made it non-blocking), but setting up proper rules will allow you to track usage statistics.
