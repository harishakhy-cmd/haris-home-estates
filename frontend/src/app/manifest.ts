import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HARIS | Housing And Rental Intelligent System',
    short_name: 'HARIS',
    description: 'HARIS is a Uganda rental marketplace for verified homes, apartments, hostels, offices, shops, landlords, and tenants.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8faf7',
    theme_color: '#16876f',
    categories: ['business', 'shopping', 'lifestyle'],
    icons: [
      {
        src: '/haris-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
