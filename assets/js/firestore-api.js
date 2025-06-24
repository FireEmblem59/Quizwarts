// In firestore-api.js
import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  return await getDoc(userRef);
}

export async function createUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, data);
}
