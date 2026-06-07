import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

/**
 * Firebase Cloud Messaging Service
 * Handles push notifications on the frontend
 */
export class NotificationService {
  private messaging: any;
  private isSupported = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Check if notifications are supported
    if (typeof window === 'undefined') return;

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);
      this.isSupported = true;
    } catch (error) {
      console.warn('Firebase initialization failed:', error);
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async registerForNotifications(): Promise<string | null> {
    if (!this.isSupported || !this.messaging) {
      console.warn('Notifications not supported');
      return null;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get token
      const token = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log('FCM Token:', token);
        return token;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }

    return null;
  }

  /**
   * Send FCM token to backend
   */
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/fcm-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ token }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to register FCM token');
      }

      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  /**
   * Listen for incoming notifications when app is open
   */
  onMessageListener(callback: (payload: any) => void): void {
    if (!this.isSupported || !this.messaging) {
      console.warn('Notifications not supported');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Notification received:', payload);
      callback(payload);
    });
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' },
      );
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Request badge and tag permission
   */
  async requestBadgeAndTagPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Badge API
      if ('setAppBadge' in navigator) {
        // This is available but requires permission
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking badge permission:', error);
      return false;
    }
  }

  /**
   * Set app badge (number on app icon)
   */
  async setAppBadge(count: number): Promise<void> {
    if (typeof window === 'undefined' || !('setAppBadge' in navigator)) {
      return;
    }

    try {
      await (navigator as any).setAppBadge(count);
    } catch (error) {
      console.error('Error setting app badge:', error);
    }
  }

  /**
   * Clear app badge
   */
  async clearAppBadge(): Promise<void> {
    if (typeof window === 'undefined' || !('clearAppBadge' in navigator)) {
      return;
    }

    try {
      await (navigator as any).clearAppBadge();
    } catch (error) {
      console.error('Error clearing app badge:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
