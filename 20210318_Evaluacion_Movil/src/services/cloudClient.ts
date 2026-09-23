import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cloudSettings = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const faltantes = Object.entries(cloudSettings)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (faltantes.length > 0) {
  throw new Error(`Faltan variables de Firebase en .env: ${faltantes.join(", ")}`);
}

const cloudApp = getApps().length === 0 ? initializeApp(cloudSettings) : getApp();

export const session = getAuth(cloudApp);
export const database = getFirestore(cloudApp);
export default cloudApp;
