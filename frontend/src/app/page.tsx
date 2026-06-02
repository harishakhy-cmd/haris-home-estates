'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building, Home, Hotel, MapPin, Search, ShieldCheck, Sparkles, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { fallbackProperties } from '@/lib/mock-data';
import { googleMapUrl, ugandaRegions } from '@/lib/uganda-regions';

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const { data } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => (await api.get('/properties')).data,
    retry: false,
  });
  const properties = data?.data?.length ? data.data : fallbackProperties;

  return (
    <main>
      <Header />
      <section className="border-b border-border bg-[linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,255,255,0))]">
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <Sparkles size={15} /> Verified rental marketplace for Uganda
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-normal md:text-6xl">Find a rental that feels clear before you visit.</h1>
              <p className="max-w-2xl text-lg text-muted-foreground">Search apartments, houses, hostels, offices, and shops with verified landlord profiles, saved listings, viewing requests, and moderated listings.</p>
            </div>
            <Card
              className="grid gap-3 p-3 shadow-soft md:grid-cols-[1fr_1fr_150px]"
              as="form"
              onSubmit={(event: any) => {
                event.preventDefault();
                const params = new URLSearchParams();
                if (location) params.set('location', location);
                if (keyword) params.set('q', keyword);
                router.push(`/properties?${params.toString()}`);
              }}
            >
              <label className="relative">
                <MapPin className="absolute left-3 top-3 text-muted-foreground" size={17} />
                <Input className="pl-9" placeholder="Kampala, Entebbe, Jinja" value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
              <Input placeholder="Budget, bedrooms, keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
              <Button type="submit"><Search size={17} /> Search</Button>
            </Card>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {['1,200+ listings', '85% verified', '24h inquiries'].map((stat) => <div key={stat} className="rounded-md border border-border bg-card p-3 font-semibold">{stat}</div>)}
            </div>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-2">
            {properties.slice(0, 2).map((property: any) => <PropertyCard key={property.id} property={property} />)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Featured listings</h2>
            <p className="mt-1 text-muted-foreground">Fresh, moderated rentals from trusted landlords.</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: any) => <PropertyCard key={property.id} property={property} />)}
        </div>
      </section>
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-4">
          {[
            ['Apartments', Home],
            ['Hostels', Hotel],
            ['Offices', Building],
            ['Shops', Store],
          ].map(([label, Icon]: any) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Icon className="text-primary" size={21} />
              <span className="font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold">Explore Uganda by region</h2>
            <p className="mt-1 max-w-2xl text-muted-foreground">Browse rentals by major region, district clusters, and active rental locations with satellite and map context.</p>
          </div>
          <Button className="bg-card text-foreground ring-1 ring-border" onClick={() => router.push('/properties')}>View all regions</Button>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {ugandaRegions.map((region) => (
            <Card key={region.slug} className="overflow-hidden">
              <div className="grid md:grid-cols-[1fr_1fr]">
                <div className="relative h-56 overflow-hidden border-b border-border md:border-b-0 md:border-r">
                  <iframe
                    title={`${region.name} aerial view`}
                    src={googleMapUrl(region.mapQuery, true)}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Aerial view</div>
                </div>
                <div className="relative h-56 overflow-hidden border-b border-border md:border-b-0">
                  <iframe
                    title={`${region.name} Google map`}
                    src={googleMapUrl(region.mapQuery)}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">Google map</div>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h3 className="text-xl font-bold">{region.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{region.locations.join(' · ')}</p>
                  </div>
                  <Button onClick={() => router.push(`/properties?region=${region.slug}`)}>View rentals</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {region.districts.map((district) => (
                    <button
                      key={district}
                      type="button"
                      onClick={() => router.push(`/properties?region=${region.slug}&location=${encodeURIComponent(district)}`)}
                      className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 md:grid-cols-3">
        {['Verified landlord signals', 'Viewing and inquiry workflow', 'Admin fraud moderation'].map((item) => (
          <Card key={item} className="p-5">
            <ShieldCheck className="mb-4 text-primary" />
            <h3 className="font-semibold">{item}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Built into the MVP architecture so HARIS can grow into a trusted commercial marketplace.</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
