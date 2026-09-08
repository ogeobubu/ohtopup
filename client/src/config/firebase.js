import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

function getFirebaseApp() {
  if (!app && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

function getFirebaseMessaging() {
  if (!messaging && typeof window !== "undefined" && "serviceWorker" in navigator) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      messaging = getMessaging(firebaseApp);
    }
  }
  return messaging;
}

export { getFirebaseApp, getFirebaseMessaging, getToken, onMessage, isSupported };
