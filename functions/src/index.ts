import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const MONTHLY_CREDITS = 100; // Updated to 100 credits as requested

// Monthly Cron Job - Reset Credits for Active Subscribers
// Runs on the 1st of every month at 00:00 UTC
export const monthlyCreditsReset = functions.pubsub.schedule("0 0 1 * *")
    .timeZone("UTC")
    .onRun(async () => {
        console.log("Running monthly credits reset...");

        // Get all users with active subscriptions (manually set by admin)
        const usersSnapshot = await db.collection("users")
            .where("hasActiveSubscription", "==", true)
            .get();

        const batch = db.batch();
        let count = 0;

        usersSnapshot.forEach((doc) => {
            // Reset balance to MONTHLY_CREDITS (do not accumulate)
            batch.update(doc.ref, {
                balance: MONTHLY_CREDITS,
                lastCreditReset: admin.firestore.FieldValue.serverTimestamp(),
            });
            count++;
        });

        if (count > 0) {
            await batch.commit();
        }

        console.log(`Reset credits for ${count} users`);
        return null;
    });
