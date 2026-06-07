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
    orientation: 'portrait-primary',
    background_color: '#f8faf7',
    theme_color: '#16876f',
    categories: ['business', 'shopping', 'lifestyle'],
    screenshots: [
      {
        src: '/screenshots/screenshot-1.png',
        sizes: '540x720',
        type: 'image/png',
        form_factor: 'narrow',
      },
      {
        src: '/screenshots/screenshot-2.png',
        sizes: '540x720',
        type: 'image/png',
        form_factor: 'narrow',
      },
      {
        src: '/screenshots/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
    icons: [
      {
        src: '/haris-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/haris-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/haris-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/haris-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'New Chat',
        short_name: 'Chat',
        description: 'Start a new conversation',
        url: '/dashboard/chat',
        icons: [
          {
            src: '/haris-logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Browse Properties',
        short_name: 'Properties',
        description: 'Browse available properties',
        url: '/properties',
        icons: [
          {
            src: '/haris-logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'My Profile',
        short_name: 'Profile',
        description: 'View your profile',
        url: '/profile',
        icons: [
          {
            src: '/haris-logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
    prefer_related_applications: false,
    related_applications: [],
  };
}
