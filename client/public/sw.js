// Firebase Cloud Messaging service worker

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBYS_Y_C0CSOpnWcg399m6Ta4WNmC1T2Uk",
  authDomain: "ohtopup-71b1a.firebaseapp.com",
  projectId: "ohtopup-71b1a",
  storageBucket: "ohtopup-71b1a.firebasestorage.app",
  messagingSenderId: "212204384070",
  appId: "1:212204384070:web:b8692c6729a145ffca3f47",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Firebase already displays messages containing a notification payload.
  if (payload.notification) return;

  // FCM may deliver data as payload.data or at payload root
  const data = payload.data || payload;
  const title = data.title || "OhTopUp";
  const body = data.body || data.message || "";
  const link = data.link || "/";

  return self.registration.showNotification(title, {
    body,
    icon: "/fav-black.png",
    badge: "/fav-black.png",
    data: { link },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.link || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
