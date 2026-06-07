import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: skip Firebase init during Next.js build/prerender when credentials are absent.
// All Firebase usage is client-side, so this is safe.
function initFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  let db: Firestore;
  try {
    db = typeof window !== "undefined"
      ? initializeFirestore(app, { localCache: persistentLocalCache() })
      : getFirestore(app);
  } catch {
    db = getFirestore(app);
  }
  return { app, auth, db };
}

const firebase = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  ? initFirebase()
  : { app: null, auth: null as unknown as Auth, db: null as unknown as Firestore };

export const auth = firebase.auth;
export const db   = firebase.db;
