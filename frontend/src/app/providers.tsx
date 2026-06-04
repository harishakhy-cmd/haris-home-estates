'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { FirebaseAnalytics } from '@/components/firebase-analytics';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { useSettingsStore, colorThemes, gradientThemes, googleFontsImport, normalizeGoogleFontName } from '@/store/settings-store';
import { SettingsModal } from '@/components/layout/settings-modal';
import { Toaster } from 'sonner';

function DynamicThemeManager() {
  const { accentMode, primaryColor, gradientColor, fontFamily, hydrateSettings } = useSettingsStore();

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    document.documentElement.dataset.accentMode = accentMode;
  }, [accentMode]);

  const activeTheme = colorThemes.find((t) => t.name === primaryColor) || colorThemes[0];
  const activeGradient = gradientThemes.find((t) => t.name === gradientColor) || gradientThemes[0];
  const primaryLight = accentMode === 'gradient' ? activeGradient.lightFrom : activeTheme.lightPrimary;
  const primaryDark = accentMode === 'gradient' ? activeGradient.darkFrom : activeTheme.darkPrimary;
  const safeFontFamily = normalizeGoogleFontName(fontFamily) || 'Inter';

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          ${googleFontsImport(safeFontFamily)}

          :root {
            --primary: ${primaryLight};
            --primary-gradient-from: ${activeGradient.lightFrom};
            --primary-gradient-to: ${activeGradient.lightTo};
            --primary-gradient: linear-gradient(135deg, hsl(var(--primary-gradient-from)), hsl(var(--primary-gradient-to)));
          }
          .dark {
            --primary: ${primaryDark};
            --primary-gradient-from: ${activeGradient.darkFrom};
            --primary-gradient-to: ${activeGradient.darkTo};
          }
          :root[data-accent-mode="gradient"] .gradient-primary-bg,
          :root[data-accent-mode="gradient"] [data-gradient-primary="true"] {
            background-image: var(--primary-gradient);
            background-color: hsl(var(--primary-gradient-from));
            color: hsl(var(--primary-foreground));
          }
          body, button, input, textarea, select {
            font-family: "${safeFontFamily}", Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
          }
        `,
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const { token, updateUser, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
