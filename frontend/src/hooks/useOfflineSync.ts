'use client';

import { useEffect, useState } from 'react';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  failedMessages: string[];
  retrySync: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [failedMessages, setFailedMessages] = useState<string[]>([]);

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      setIsOnline(true);
      retrySync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Initialize online status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retrySync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // Request background sync if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          try {
            (registration as any).sync.register('sync-messages');
          } catch (error) {
            console.warn('Background sync not available:', error);
          }
        }
      }

      // Try to resync failed messages
      const failedStr = localStorage.getItem('failedMessages');
      if (failedStr) {
        const failed: Array<{ id: string }> = JSON.parse(failedStr);
        const synced: string[] = [];

        for (const msg of failed) {
          try {
            const response = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(msg),
            });

            if (response.ok) {
              synced.push(msg.id);
            }
          } catch (error) {
            console.warn('Failed to sync message:', error);
          }
        }

        if (synced.length > 0) {
          const remaining = failed.filter((m) => !synced.includes(m.id));
          if (remaining.length > 0) {
            localStorage.setItem('failedMessages', JSON.stringify(remaining));
            setFailedMessages(remaining.map((m) => m.id));
          } else {
            localStorage.removeItem('failedMessages');
            setFailedMessages([]);
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    failedMessages,
    retrySync,
  };
}
