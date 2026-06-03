'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bath, BedDouble, Heart, MapPin, UserRound } from 'lucide-react';
import { Card } from '../ui/card';
import { money } from '@/lib/utils';
import { googleDriveImageUrl } from '@/lib/media';
import { api } from '@/lib/api';
import { addTenantFavorite, isTenantFavorite, removeTenantFavorite } from '@/lib/tenant-activity';
import { useAuthStore } from '@/store/auth-store';

export function PropertyCard({ property }: { property: any }) {
  const [saved, setSaved] = useState(false);
  const { user, token, hydrate } = useAuthStore();
  const image = googleDriveImageUrl(property.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user?.role === 'TENANT') setSaved(isTenantFavorite(user.id, property.id));
  }, [property.id, user]);

  async function toggleFavorite() {
    if (user?.role !== 'TENANT') return setSaved((value) => !value);
    const next = !saved;
    setSaved(next);
    if (next) addTenantFavorite(user.id, property);
    else removeTenantFavorite(user.id, property.id);
    try {
      if (token && next) await api.post(`/favorites/${property.id}`);
      if (token && !next) await api.delete(`/favorites/${property.id}`);
    } catch {}
  }
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/property/?id=${property.id}`} className="block size-full">
          <img src={image} alt={property.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </Link>
        <button
          aria-label={saved ? 'Remove saved property' : 'Save property'}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow transition hover:scale-105"
          onClick={toggleFavorite}
          type="button"
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <Link href={`/property/?id=${property.id}`} className="block">
        <div className="space-y-3 p-4">
          <div>
            <h3 className="line-clamp-1 font-semibold">{property.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} /> {property.district ? `${property.district}, ` : ''}{property.city}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <UserRound size={14} /> {property.landlord ? `${property.landlord.firstName ?? ''} ${property.landlord.lastName ?? ''}`.trim() : 'Verified landlord'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-bold text-primary">{money(property.price, property.currency)}<span className="text-xs font-medium text-muted-foreground"> / mo</span></p>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><BedDouble size={15} /> {property.bedrooms}</span>
              <span className="flex items-center gap-1"><Bath size={15} /> {property.bathrooms}</span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
