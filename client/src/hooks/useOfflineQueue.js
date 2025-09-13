import { useState, useEffect, useCallback } from 'react';

const OFFLINE_QUEUE_KEY = 'ohtopup_offline_queue';

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Error loading offline queue:', error);
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } else {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (queue.length > 0) {
        processQueue();
      }
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
  }, [queue.length]);

  // Add transaction to queue
  const addToQueue = useCallback((transaction) => {
    const queuedTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'queued'
    };

    setQueue(prev => [...prev, queuedTransaction]);
    return queuedTransaction.id;
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Process queue (sync with server)
  const processQueue = useCallback(async () => {
    if (isProcessing || !isOnline || queue.length === 0) return;

    setIsProcessing(true);

    try {
      const processedIds = [];

      for (const transaction of queue) {
        try {
          // Here you would make the actual API call
          // For now, we'll simulate success
          console.log('Processing offline transaction:', transaction);

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Mark as processed
          processedIds.push(transaction.id);
        } catch (error) {
          console.error('Failed to process transaction:', transaction.id, error);
          // Keep failed transactions in queue for retry
        }
      }

      // Remove successfully processed transactions
      if (processedIds.length > 0) {
        setQueue(prev => prev.filter(item => !processedIds.includes(item.id)));
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, isOnline, queue]);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    isOnline,
    queue,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
    queueLength: queue.length
  };
};