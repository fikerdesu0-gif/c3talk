import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, serverTimestamp } from "firebase/firestore";

export interface UserCredits {
    balance: number;
    isPremium: boolean; // For the annual plan tracking, though we just check credits for now
    lastUpdated: any;
}

export const INITIAL_CREDITS = 5;
export const PLAN_CREDITS = 100; // Updated to 100
export const PLAN_PRICE_AED = 144; // Updated to 144 (Yearly)

// Initialize user with free credits if they don't exist
export const initializeUserCredits = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const user = auth.currentUser;
        const isAnonymous = user?.isAnonymous;

        if (isAnonymous) {
            // Case A: Guest User (5 Free Credits)
            await setDoc(userRef, {
                balance: INITIAL_CREDITS,
                isPremium: false,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                phoneNumber: null,
                type: 'guest'
            });
            return INITIAL_CREDITS;
        } else {
            // Case B: Premium User (Manually Created by Admin)
            // We assume any non-anonymous login is a paid user since we don't have public sign-ups.

            // Extract phone from email (e.g., 971501234567@c3talk.com -> +971501234567)
            let phone = user?.email?.split('@')[0] || null;
            if (phone && !phone.startsWith('+')) phone = '+' + phone;

            const now = new Date();
            const oneYearLater = new Date();
            oneYearLater.setFullYear(now.getFullYear() + 1);

            await setDoc(userRef, {
                balance: PLAN_CREDITS, // 100
                isPremium: true,
                hasActiveSubscription: true,
                subscriptionStatus: 'active',
                subscriptionStartDate: now,
                subscriptionEndDate: oneYearLater,
                phoneNumber: phone,
                email: user?.email,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                type: 'premium'
            });
            return PLAN_CREDITS;
        }
    } else {
        return userSnap.data().balance;
    }
};

// Get current credit balance
export const getUserCredits = async (userId: string): Promise<number> => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data().balance;
    }
    return 0;
};

// Deduct credits
// Returns true if successful, false if insufficient funds
export const deductCredits = async (userId: string, amount: number): Promise<boolean> => {
    const userRef = doc(db, "users", userId);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw "User does not exist!";
            }

            const newBalance = userDoc.data().balance - amount;
            if (newBalance < 0) {
                throw "Insufficient credits";
            }

            transaction.update(userRef, {
                balance: newBalance,
                lastUpdated: serverTimestamp()
            });
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        return false;
    }
};

// Add credits (for the paid plan)
export const addCredits = async (userId: string, amount: number) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        balance: increment(amount),
        isPremium: true, // Mark as having bought a plan
        lastUpdated: serverTimestamp()
    });
};
