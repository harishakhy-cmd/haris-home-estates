'use client';

import React, { ReactNode } from 'react';
import { useServiceWorkerRegistration } from '@/hooks/useServiceWorkerRegistration';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { UpdateNotification } from '@/components/pwa/UpdateNotification';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  useServiceWorkerRegistration();

  return (
    <>
      <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none space-y-3">
        <div className="pointer-events-auto">
          <PWAInstallPrompt />
        </div>
        <div className="pointer-events-auto">
          <UpdateNotification />
        </div>
      </div>

      <div className="pointer-events-auto">
        <OfflineIndicator position="bottom" />
      </div>

      {children}
    </>
  );
};
