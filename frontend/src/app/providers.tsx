'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { FirebaseAnalytics } from '@/components/firebase-analytics';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { useSettingsStore, colorThemes } from '@/store/settings-store';
import { SettingsModal } from '@/components/layout/settings-modal';
import { Toaster } from 'sonner';

function DynamicThemeManager() {
  const { primaryColor, fontFamily, hydrateSettings } = useSettingsStore();

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  const activeTheme = colorThemes.find((t) => t.name === primaryColor) || colorThemes[0];

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

          :root {
            --primary: ${activeTheme.lightPrimary};
          }
          .dark {
            --primary: ${activeTheme.darkPrimary};
          }
          body, button, input, textarea, select {
            font-family: "${fontFamily}", Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
          }
        `,
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const { token, updateUser } = useAuthStore();

  useEffect(() => {
    const splash = document.getElementById('pwa-splash');
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add('splash-fade-out');
        setTimeout(() => {
          splash.style.display = 'none';
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
        <DynamicThemeManager />
        {children}
        <SettingsModal />
        <Toaster theme="system" position="bottom-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

