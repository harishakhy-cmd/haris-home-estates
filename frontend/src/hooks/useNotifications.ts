import { useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export function useNotifications(onNotification?: (payload: NotificationPayload) => void) {
  useEffect(() => {
    // Register service worker
    notificationService.registerServiceWorker();

    // Request notification permission and register
    const registerNotifications = async () => {
      if (!notificationService.isNotificationSupported()) {
        console.warn('Notifications not supported in this browser');
        return;
      }

      try {
        const token = await notificationService.registerForNotifications();
        if (token) {
          await notificationService.sendTokenToBackend(token);
        }
      } catch (error) {
        console.error('Error registering notifications:', error);
      }
    };

    registerNotifications();
  }, []);

  // Listen for notifications when app is open
  useEffect(() => {
    if (!notificationService.isNotificationSupported()) {
      return;
    }

    notificationService.onMessageListener((payload: any) => {
      console.log('Notification received when app is open:', payload);

      if (onNotification) {
        onNotification({
          title: payload.notification?.title || 'Notification',
          body: payload.notification?.body || '',
          data: payload.data,
        });
      }

      // Show browser notification even when app is open
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/logo.png',
          badge: payload.notification.badge || '/badge.png',
          tag: payload.notification.tag,
          data: payload.data,
        });
      }
    });
  }, [onNotification]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const setAppBadge = useCallback(async (count: number): Promise<void> => {
    try {
      await notificationService.setAppBadge(count);
    } catch (error) {
      console.error('Error setting app badge:', error);
    }
  }, []);

  const clearAppBadge = useCallback(async (): Promise<void> => {
    try {
      await notificationService.clearAppBadge();
    } catch (error) {
      console.error('Error clearing app badge:', error);
    }
  }, []);

  return {
    isSupported: notificationService.isNotificationSupported(),
    requestPermission,
    setAppBadge,
    clearAppBadge,
  };
}
