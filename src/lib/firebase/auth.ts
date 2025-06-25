import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { firebaseApp } from "./config";

export const provider = new GoogleAuthProvider();
export const auth = typeof window !== "undefined" ? getAuth(firebaseApp) : null;

export { onAuthStateChanged, signInWithPopup, signOut, type User };
