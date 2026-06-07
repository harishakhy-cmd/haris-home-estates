'use client';

import { useCallback, useEffect, useState } from 'react';

interface OfflineMessage {
  id: string;
  content: string;
  recipientId: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface UseOfflineQueueReturn {
  queue: OfflineMessage[];
  addToQueue: (message: Omit<OfflineMessage, 'id' | 'timestamp' | 'retries'>) => string;
  removeFromQueue: (messageId: string) => void;
  clearQueue: () => void;
  syncQueue: () => Promise<{ synced: number; failed: number } | undefined>;
  isSyncing: boolean;
}

const QUEUE_STORAGE_KEY = 'offlineMessageQueue';
const MAX_RETRIES = 3;

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queue, setQueue] = useState<OfflineMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
        localStorage.removeItem(QUEUE_STORAGE_KEY);
      }
    }
  }, []);

  // Save queue to storage whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } else {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  }, [queue]);

  const addToQueue = useCallback(
    (message: Omit<OfflineMessage, 'id' | 'timestamp' | 'retries'>) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newMessage: OfflineMessage = {
        ...message,
        id,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: MAX_RETRIES,
      };

      setQueue((prev) => [...prev, newMessage]);
      return id;
    },
    []
  );

  const removeFromQueue = useCallback((messageId: string) => {
    setQueue((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }, []);

  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);
    const syncedIds: string[] = [];
    const failedMessages: OfflineMessage[] = [];

    for (const message of queue) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: message.content,
            recipientId: message.recipientId,
          }),
        });

        if (response.ok) {
          syncedIds.push(message.id);
        } else {
          failedMessages.push({
            ...message,
            retries: message.retries + 1,
          });
        }
      } catch (error) {
        console.warn(`Failed to sync message ${message.id}:`, error);
        failedMessages.push({
          ...message,
          retries: message.retries + 1,
        });
      }
    }

    // Update queue with only failed messages
    setQueue((prev) => {
      const updated = prev
        .map((msg) => {
          const failed = failedMessages.find((f) => f.id === msg.id);
          return failed && failed.retries < failed.maxRetries ? failed : undefined;
        })
        .filter((msg) => msg !== undefined) as OfflineMessage[];

      return updated;
    });

    setIsSyncing(false);

    return {
      synced: syncedIds.length,
      failed: failedMessages.filter((m) => m.retries >= m.maxRetries).length,
    };
  }, [queue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    syncQueue,
    isSyncing,
  };
}
