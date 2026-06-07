'use client';

import { useEffect, useState } from 'react';

interface UseVersionDetectionReturn {
  hasUpdate: boolean;
  isChecking: boolean;
  refreshPage: () => void;
  dismissUpdate: () => void;
}

export function useVersionDetection(): UseVersionDetectionReturn {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let checkInterval: NodeJS.Timeout;

    const handleServiceWorkerUpdate = () => {
      setHasUpdate(true);
    };

    const checkForUpdates = async () => {
      if (!registration) return;

      try {
        setIsChecking(true);
        await registration.update();
      } catch (error) {
        console.error('Error checking for updates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Listen for service worker updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              handleServiceWorkerUpdate();
            }
          });
        }
      });

      // Check for updates periodically (every hour)
      checkForUpdates();
      checkInterval = setInterval(checkForUpdates, 60 * 60 * 1000);
    });

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [registration]);

  const refreshPage = () => {
    window.location.reload();
  };

  const dismissUpdate = () => {
    setHasUpdate(false);
  };

  return {
    hasUpdate,
    isChecking,
    refreshPage,
    dismissUpdate,
  };
}
