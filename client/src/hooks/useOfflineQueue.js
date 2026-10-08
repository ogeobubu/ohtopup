import { useState, useEffect } from 'react';

const OFFLINE_QUEUE_KEY = 'ohtopup_offline_queue';

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => { localStorage.removeItem(OFFLINE_QUEUE_KEY); }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    queue: [],
    isProcessing: false,
    queueLength: 0
  };
};
