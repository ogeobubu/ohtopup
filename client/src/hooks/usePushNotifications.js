import { useState, useEffect, useCallback } from "react";
import { getFirebaseMessaging, getToken } from "../config/firebase";
import { subscribeWebPush, unsubscribeWebPush } from "../api";

export default function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      "serviceWorker" in navigator &&
        "Notification" in window &&
        "PushManager" in window
    );
  }, []);

  // Check existing subscription on mount
  useEffect(() => {
    if (!supported) return;

    const check = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setPermission(Notification.permission);
      } catch {
        // SW not ready
      }
    };

    check();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return false;

    const token = localStorage.getItem("ohtopup-token");
    if (!token) return false;

    setLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setLoading(false);
        return false;
      }

      const messaging = getFirebaseMessaging();
      if (!messaging) {
        console.error("Firebase messaging not available");
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      const fcmToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: reg,
      });

      if (!fcmToken) {
        console.error("Failed to get FCM token");
        setLoading(false);
        return false;
      }

      console.log("FCM token obtained:", fcmToken.substring(0, 20) + "...");

      await subscribeWebPush({
        endpoint: fcmToken,
        keys: { p256dh: "", auth: "" },
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return false;

    setLoading(true);

    try {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        const reg = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          serviceWorkerRegistration: reg,
        });
        if (token) {
          await unsubscribeWebPush(token);
        }
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  // Auto-subscribe when permission already granted
  useEffect(() => {
    if (!supported || permission !== "granted") return;

    const token = localStorage.getItem("ohtopup-token");
    if (!token) return;

    const autoSubscribe = async () => {
      try {
        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const reg = await navigator.serviceWorker.ready;
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });

        if (fcmToken) {
          await subscribeWebPush({
            endpoint: fcmToken,
            keys: { p256dh: "", auth: "" },
          });
          setIsSubscribed(true);
        }
      } catch {
        // ignore
      }
    };

    autoSubscribe();
  }, [supported, permission]);

  return {
    supported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
