# How to Fix "FirebaseError: The query requires an index"

The error you are seeing in the console (`FirebaseError: The query requires an index`) is happening because we are trying to sort the user's history by `timestamp` while filtering by `userId`. Firestore requires a composite index for this specific query.

To fix this, you need to create the index in your Firebase Console.

## Steps to Fix:

1.  **Open the Error Link**:
    In the error message you pasted, there is a long URL starting with `https://console.firebase.google.com/...`.
    
    > **Click that link directly.**

2.  **Create Index**:
    The link will take you to the Firestore Indexes page with the correct index configuration pre-filled.
    It should look like this:
    *   **Collection ID**: `translations`
    *   **Fields**:
        *   `userId` (Ascending)
        *   `timestamp` (Descending)
    
    Click the **"Create Index"** button.

3.  **Wait**:
    It may take a few minutes for the index to build. Once the status changes to "Enabled", the History feature in your app will start working immediately. You do not need to redeploy the app.

## Why is this needed?
Firestore requires explicit indexes for compound queries (queries that use both `where` and `orderBy` on different fields) to ensure performance at scale.
