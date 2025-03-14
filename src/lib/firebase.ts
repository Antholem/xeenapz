// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from your Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAd8i31LbxUuHGjRq4TmT4hzWTds9gfr0Q",
    authDomain: "xeenapz.firebaseapp.com",
    projectId: "xeenapz",
    storageBucket: "xeenapz.firebasestorage.app",
    messagingSenderId: "1033979416912",
    appId: "1:1033979416912:web:2f3368fbdc9729f3c79c55"
};

// Initialize Firebase app only if it's not already initialized
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore, GoogleAuthProvider, signInWithPopup, signOut };
