import type { MetadataRoute } from 'next';
import { fallbackProperties } from '@/lib/mock-data';
import { ugandaRegions } from '@/lib/uganda-regions';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/properties`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/auth`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const regionRoutes: MetadataRoute.Sitemap = ugandaRegions.map((region) => ({
    url: `${siteUrl}/properties?region=${region.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  const propertyRoutes: MetadataRoute.Sitemap = fallbackProperties.map((property) => ({
    url: `${siteUrl}/properties/${property.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...regionRoutes, ...propertyRoutes];
}
