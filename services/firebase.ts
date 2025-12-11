import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD9v0QKWRtMVaHHfhho5OcVYkCjOAxUya4",
  authDomain: "c3talk-b19ef.firebaseapp.com",
  projectId: "c3talk-b19ef",
  storageBucket: "c3talk-b19ef.firebasestorage.app",
  messagingSenderId: "434910550026",
  appId: "1:434910550026:web:de814a9b6d16d10bc327f3",
  measurementId: "G-N7RNN0678G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use device language for auth flow
auth.useDeviceLanguage();