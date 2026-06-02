import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
    google: 'HR6SR4YsH7wsb0n8Y6xIurZfHsjj--zYctzMQJtsxqE',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
