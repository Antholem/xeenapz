import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  endBefore,
  limit,
  QueryDocumentSnapshot,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseApp } from "@/lib/firebase/config";

export const db = getFirestore(firebaseApp);

export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  endBefore,
  limit,
  QueryDocumentSnapshot,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
};
