const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

let app = null;

function getFirebaseApp() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });

  return app;
}

function getFirebaseMessaging() {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  return getMessaging(firebaseApp);
}

module.exports = { getFirebaseApp, getFirebaseMessaging };
