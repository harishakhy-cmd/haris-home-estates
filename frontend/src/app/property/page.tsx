'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PropertyDetailClient } from './property-detail-client';
import { Loader2 } from 'lucide-react';

function PropertyPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  return <PropertyDetailClient propertyId={id} />;
}

export default function PropertyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0c101d] text-white">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    }>
      <PropertyPageContent />
    </Suspense>
  );
}
