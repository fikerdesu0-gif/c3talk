import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { DISABLE_CREDIT_DEDUCTION } from "../config";

export interface UserCredits {
    balance: number;
    isPremium: boolean; // For the annual plan tracking, though we just check credits for now
    lastUpdated: any;
}

export const INITIAL_CREDITS = 5;
export const PLAN_CREDITS = 100; // Updated to 100
export const PLAN_PRICE_AED = 144; // Updated to 144 (Yearly)

const DEVICE_ID_KEY = 'c3talk_device_id';
const GUEST_CREDITS_KEY = 'c3talk_guest_credits';

const getDeviceId = (): string => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
};

export const getGuestCredits = (): number => {
    getDeviceId();
    const raw = localStorage.getItem(GUEST_CREDITS_KEY);
    if (raw === null) {
        localStorage.setItem(GUEST_CREDITS_KEY, String(INITIAL_CREDITS));
        return INITIAL_CREDITS;
    }
    const val = parseFloat(raw);
    return isNaN(val) ? INITIAL_CREDITS : val;
};

const setGuestCredits = (value: number) => {
    localStorage.setItem(GUEST_CREDITS_KEY, String(Math.max(0, value)));
    window.dispatchEvent(new CustomEvent('c3talk:credits-updated'));
};

// Initialize user with free credits if they don't exist
export const initializeUserCredits = async (userId: string) => {
    const user = auth.currentUser;
    const isAnonymous = user?.isAnonymous;
    if (isAnonymous) {
        return getGuestCredits();
    }
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        let phone = user?.email?.split('@')[0] || null;
        if (phone && !phone.startsWith('+')) phone = '+' + phone;
        const now = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(now.getFullYear() + 1);
        await setDoc(userRef, {
            balance: PLAN_CREDITS,
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
    return userSnap.data().balance;
};

// Get current credit balance
export const getUserCredits = async (userId: string): Promise<number> => {
    const user = auth.currentUser;
    if (user?.isAnonymous) {
        return getGuestCredits();
    }
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
    if (DISABLE_CREDIT_DEDUCTION) {
        console.log("Credit deduction is disabled. Skipping deduction.");
        return true;
    }
    const user = auth.currentUser;
    if (user?.isAnonymous) {
        const current = getGuestCredits();
        const newBalance = current - amount;
        if (newBalance < 0) {
            return false;
        }
        setGuestCredits(newBalance);
        return true;
    }
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
