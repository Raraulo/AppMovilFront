import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: "wawalle.firebaseapp.com",
  projectId: "wawalle",
  storageBucket: "wawalle.firebasestorage.app",
  messagingSenderId: "913227071339",
  appId: "1:913227071339:web:21f2333aebb750ce7dd62e",
  measurementId: "G-ZVFK4JTJ23",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
