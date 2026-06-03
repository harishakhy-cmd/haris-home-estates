'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { FirebaseAnalytics } from '@/components/firebase-analytics';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const { token, updateUser } = useAuthStore();

  useEffect(() => {
    const splash = document.getElementById('pwa-splash');
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add('splash-fade-out');
        setTimeout(() => {
          splash.remove();
        }, 500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (token && !token.startsWith('local-')) {
      api.get('/auth/me')
        .then(({ data }) => {
          updateUser(data);
        })
        .catch(() => {});
    }
  }, [token, updateUser]);

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FirebaseAnalytics />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
