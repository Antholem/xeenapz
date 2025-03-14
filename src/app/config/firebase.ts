// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAd8i31LbxUuHGjRq4TmT4hzWTds9gfr0Q",
    authDomain: "xeenapz.firebaseapp.com",
    projectId: "xeenapz",
    storageBucket: "xeenapz.firebasestorage.app",
    messagingSenderId: "1033979416912",
    appId: "1:1033979416912:web:2f3368fbdc9729f3c79c55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

export default app;
