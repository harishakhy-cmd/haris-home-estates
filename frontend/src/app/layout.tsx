import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { BottomNav } from '@/components/layout/bottom-nav';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hakhybeat.web.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'HARIS',
  title: {
    default: 'HARIS | Housing And Rental Intelligent System',
    template: '%s | HARIS',
  },
  description: 'HARIS is a Uganda rental marketplace for apartments, houses, hostels, offices, shops, landlords, tenants, bookings, and verified property listings.',
  keywords: [
    'HARIS',
    'Housing And Rental Intelligent System',
    'HARIS Uganda',
    'Uganda rentals',
    'houses for rent Uganda',
    'apartments for rent Kampala',
    'hostels in Uganda',
    'landlords Uganda',
    'tenant marketplace Uganda',
    'real estate Uganda',
  ],
  authors: [{ name: 'HARIS' }],
  creator: 'HARIS',
  publisher: 'HARIS',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    url: '/',
    siteName: 'HARIS',
    title: 'HARIS | Housing And Rental Intelligent System',
    description: 'Find verified rentals in Uganda across apartments, houses, hostels, offices, shops, and managed property listings.',
    images: [
      {
        url: '/haris-logo.png',
        width: 1200,
        height: 630,
        alt: 'HARIS Housing And Rental Intelligent System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HARIS | Housing And Rental Intelligent System',
    description: 'A Uganda rental marketplace for verified properties, landlords, tenants, bookings, and inquiries.',
    images: ['/haris-logo.png'],
  },
  icons: {
    icon: '/haris-logo.png',
    apple: '/haris-logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'nw51-t-FH-TJ3ipeOjZAhlqiV3r7elVimMDuMauSCbc',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div
          id="pwa-splash"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0c101d',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            transition: 'opacity 0.5s ease, visibility 0.5s',
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes pulse {
                  0%, 100% { transform: scale(0.9); opacity: 0.6; }
                  50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5)); }
                }
                .splash-pulse-logo {
                  width: 140px;
                  height: 140px;
                  object-fit: contain;
                  animation: pulse 1.8s infinite ease-in-out;
                }
                .splash-fade-out {
                  opacity: 0 !important;
                  visibility: hidden !important;
                  pointer-events: none !important;
                }
              `,
            }}
          />
          <img src="/haris-logo.png" className="splash-pulse-logo" alt="HARIS Logo" />
        </div>
        <Providers>
          <div className="min-h-screen pb-16 md:pb-0">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
