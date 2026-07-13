import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nexdose-f9a1c-default-rtdb.firebaseio.com"
};

// Check if credentials are fully configured
const isConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    console.log('[Firebase] Successfully initialized. Project:', firebaseConfig.projectId);
    console.log('[Firebase] Firestore instance ready.');
    console.log('[Firebase] Realtime Database instance ready.');
  } catch (error) {
    console.error('[Firebase] Error initializing:', error);
  }
} else {
  console.warn(
    '[Firebase] Missing configuration. Please set VITE_FIREBASE_* environment variables in .env'
  );
}

export { auth, db, rtdb, isConfigured };
