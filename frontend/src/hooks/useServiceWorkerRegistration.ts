'use client';

import { useEffect } from 'react';

export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/main-sw.js', {
          scope: '/',
        });

        console.log('Service Worker registered:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Listen for controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Notify user of update
          const event = new CustomEvent('sw:update');
          window.dispatchEvent(event);
        });

        // Handle waiting service worker
        if (registration.waiting) {
          promptUserToRefresh(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if ((newWorker.state as any) === 'waiting' && navigator.serviceWorker.controller) {
                promptUserToRefresh(newWorker);
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    // Register after a short delay to avoid blocking initial load
    const timeoutId = setTimeout(registerServiceWorker, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
}

function promptUserToRefresh(worker: ServiceWorker) {
  const event = new CustomEvent('sw:updateAvailable', { detail: { worker } });
  window.dispatchEvent(event);

  // Also send postMessage to notify
  worker.postMessage({ type: 'SKIP_WAITING' });
}
