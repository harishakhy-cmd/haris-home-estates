'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fallbackProperties } from '@/lib/mock-data';
import { getLocalProperties } from '@/lib/local-properties';
import { ugandaRegions } from '@/lib/uganda-regions';
import { api } from '@/lib/api';

export default function PropertiesPage() {
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [landlord, setLandlord] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [localProperties, setLocalProperties] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState({ location: '', keyword: '', maxPrice: '', type: '', region: '', landlord: '', sortBy: 'newest', page: 1 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = {
      location: params.get('location') ?? '',
      keyword: params.get('q') ?? '',
      maxPrice: params.get('maxPrice') ?? '',
      type: params.get('type') ?? '',
      region: params.get('region') ?? '',
      landlord: params.get('landlord') ?? '',
      sortBy: params.get('sortBy') ?? 'newest',
      page: Number(params.get('page') ?? '1'),
    };
    setLocation(initial.location);
    setKeyword(initial.keyword);
    setMaxPrice(initial.maxPrice);
    setType(initial.type);
    setRegion(initial.region);
    setLandlord(initial.landlord);
    setSortBy(initial.sortBy);
    setPage(initial.page);
    setSubmitted(initial);
  }, []);

  useEffect(() => {
    const refreshLocalProperties = () => setLocalProperties(getLocalProperties());
    refreshLocalProperties();
    window.addEventListener('haris-local-properties', refreshLocalProperties);
    return () => window.removeEventListener('haris-local-properties', refreshLocalProperties);
  }, []);

  const apiListings = useQuery({
    queryKey: ['properties', submitted],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(submitted.page),
        limit: '12',
        sortBy: submitted.sortBy,
      });
      if (submitted.keyword) params.set('q', submitted.keyword);
      if (submitted.location) params.set('city', submitted.location);
      if (submitted.maxPrice) params.set('maxPrice', submitted.maxPrice);
      if (submitted.type) params.set('propertyType', submitted.type);
      return (await api.get(`/properties?${params.toString()}`)).data;
    },
    retry: false,
  });

  const fallbackFiltered = useMemo(() => {
    const merged = [...localProperties, ...fallbackProperties.filter((fallbackItem) => !localProperties.some((localItem) => localItem.id === fallbackItem.id))];
    const filtered = merged.filter((property) => {
      const locationMatch = !submitted.location || `${property.city} ${property.district}`.toLowerCase().includes(submitted.location.toLowerCase());
      const keywordMatch = !submitted.keyword || `${property.title} ${property.description} ${property.propertyType}`.toLowerCase().includes(submitted.keyword.toLowerCase());
      const priceMatch = !submitted.maxPrice || Number(property.price) <= Number(submitted.maxPrice);
      const typeMatch = !submitted.type || property.propertyType === submitted.type;
      const regionMatch = !submitted.region || property.region === submitted.region;
      const landlordMatch = !submitted.landlord || `${property.landlord?.firstName ?? ''} ${property.landlord?.lastName ?? ''}`.toLowerCase().includes(submitted.landlord.toLowerCase());
      return locationMatch && keywordMatch && priceMatch && typeMatch && regionMatch && landlordMatch;
    });
    const sorted = submitted.sortBy === 'landlord'
      ? [...filtered].sort((a, b) => `${a.landlord?.firstName ?? ''}`.localeCompare(`${b.landlord?.firstName ?? ''}`))
      : submitted.sortBy === 'price_asc'
        ? [...filtered].sort((a, b) => Number(a.price) - Number(b.price))
        : submitted.sortBy === 'price_desc'
          ? [...filtered].sort((a, b) => Number(b.price) - Number(a.price))
          : filtered;
    const start = (submitted.page - 1) * 12;
    return { data: sorted.slice(start, start + 12), total: sorted.length, totalPages: Math.max(1, Math.ceil(sorted.length / 12)) };
  }, [submitted, localProperties]);

  const apiData = apiListings.data?.data ?? [];
  const useApiData = apiListings.isSuccess;
  const apiWithLocal = [...localProperties, ...apiData.filter((apiItem: any) => !localProperties.some((localItem) => localItem.id === apiItem.id))];
  const properties = useApiData ? apiWithLocal.filter((property: any) => {
    const landlordMatch = !submitted.landlord || `${property.landlord?.firstName ?? ''} ${property.landlord?.lastName ?? ''}`.toLowerCase().includes(submitted.landlord.toLowerCase());
    const regionMatch = !submitted.region || property.region === submitted.region;
    return landlordMatch && regionMatch;
  }) : fallbackFiltered.data;
  const total = useApiData ? properties.length : fallbackFiltered.total;
  const totalPages = useApiData ? Math.max(1, Math.ceil(total / 12)) : fallbackFiltered.totalPages;
  const pagedProperties = useApiData ? properties.slice((submitted.page - 1) * 12, ((submitted.page - 1) * 12) + 12) : properties;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Find rentals</h1>
          <p className="mt-1 text-muted-foreground">Filter apartments, houses, hostels, offices, shops, and managed units.</p>
        </div>
        <Card className="mb-8 p-4">
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_140px_140px_150px_150px_130px]"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSubmitted({ location, keyword, maxPrice, type, region, landlord, sortBy, page: 1 });
            }}
          >
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Keyword" />
            <Input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" placeholder="Max rent" />
            <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">Any region</option>
              {ugandaRegions.map((item) => <option key={item.slug} value={item.slug}>{item.name.replace(' Uganda', '')}</option>)}
            </select>
            <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">Any type</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="HOSTEL">Hostel</option>
              <option value="OFFICE">Office</option>
              <option value="SHOP">Shop</option>
            </select>
            <Input value={landlord} onChange={(event) => setLandlord(event.target.value)} placeholder="Landlord" />
            <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="landlord">By landlord</option>
              <option value="price_asc">Rent low-high</option>
              <option value="price_desc">Rent high-low</option>
            </select>
            <Button type="submit"><Search size={17} /> Apply</Button>
          </form>
        </Card>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={16} /> {total} matching listings · 12 per page
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pagedProperties.map((property: any) => <PropertyCard key={property.id} property={property} />)}
        </div>
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button type="button" className="bg-card text-foreground ring-1 ring-border" disabled={submitted.page <= 1} onClick={() => { const next = submitted.page - 1; setPage(next); setSubmitted({ ...submitted, page: next }); }}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {submitted.page} of {totalPages}</span>
            <Button type="button" className="bg-card text-foreground ring-1 ring-border" disabled={submitted.page >= totalPages} onClick={() => { const next = submitted.page + 1; setPage(next); setSubmitted({ ...submitted, page: next }); }}>Next</Button>
          </div>
        )}
        {!pagedProperties.length && <Card className="mt-6 p-8 text-center text-muted-foreground">No listings match those filters. Try widening your search.</Card>}
      </section>
    </main>
  );
}
