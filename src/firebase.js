import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXzFcYoXnSWHwYtHep_3QdJcpX_jc6RIM",
  authDomain: "scent-profile.firebaseapp.com",
  projectId: "scent-profile",
  storageBucket: "scent-profile.firebasestorage.app",
  messagingSenderId: "468026911841",
  appId: "1:468026911841:web:1d569fb4f277f9facc8e20"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* Sign in anonymously — gives each browser a unique UID */
export function signIn() {
  return signInAnonymously(auth);
}

/* Listen for auth state changes */
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/* Save all user data to Firestore in a single document */
export async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (e) {
    console.error("Firebase save error:", e);
  }
}

/* Load user data from Firestore */
export async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.error("Firebase load error:", e);
  }
  return null;
}
