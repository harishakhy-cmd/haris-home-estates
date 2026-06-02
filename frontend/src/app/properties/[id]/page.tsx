import { fallbackProperties } from '@/lib/mock-data';
import { PropertyDetailClient } from './property-detail-client';

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return fallbackProperties.map((property) => ({
    id: property.id,
  }));
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;

  return <PropertyDetailClient propertyId={id} />;
}
