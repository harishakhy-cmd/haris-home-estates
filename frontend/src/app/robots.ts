import type { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/profile'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
