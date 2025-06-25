import { initializeApp, getApps, getApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type DocumentReference,
  type Unsubscribe,
  DocumentData,
  endBefore,
  limit,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize on the client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// `auth` must only be used in the browser
const auth = typeof window !== "undefined" ? getAuth(app) : null;

export {
  app,
  db,
  auth,
  provider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  endBefore,
  limit,
  QueryDocumentSnapshot,
  type DocumentData,
  type User,
  type Unsubscribe,
  type DocumentReference,
};
