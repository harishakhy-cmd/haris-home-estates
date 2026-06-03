'use client';

import { useQuery } from '@tanstack/react-query';
import { Bath, BedDouble, CalendarDays, Heart, Loader2, MapPin, MessageSquare, Navigation, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { getLocalPropertyById } from '@/lib/local-properties';
import { fallbackProperties } from '@/lib/mock-data';
import { money } from '@/lib/utils';
import { googleDriveImageUrl, whatsappUrl, youtubeEmbedUrl } from '@/lib/media';
import { addTenantFavorite, addTenantViewed, isTenantFavorite, removeTenantFavorite, addLocalBooking, addLocalReview, addLocalInquiry } from '@/lib/tenant-activity';
import { useAuthStore } from '@/store/auth-store';
import { googleMapDirectionsUrl, googleMapSearchUrl, googleMapUrl } from '@/lib/uganda-regions';

type PropertyDetailClientProps = {
  propertyId: string;
};

export function PropertyDetailClient({ propertyId }: PropertyDetailClientProps) {
  const [saved, setSaved] = useState(false);
  const [viewingDate, setViewingDate] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantContact, setTenantContact] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');
  const [landlordRating, setLandlordRating] = useState('5');
  const [landlordComment, setLandlordComment] = useState('');
  const [notice, setNotice] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const { user, token, hydrate } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => (await api.get(`/properties/${propertyId}`)).data,
    retry: false,
  });
  const property = data?.id ? data : getLocalPropertyById(propertyId) ?? fallbackProperties.find((item) => item.id === propertyId) ?? fallbackProperties[0];
  const landlordId = property.landlord?.id;
  const landlordReviews = useQuery({
    queryKey: ['landlord-reviews', landlordId],
    queryFn: async () => (await api.get(`/reviews/landlords/${landlordId}`)).data,
    enabled: Boolean(landlordId),
    retry: false,
  });
  const image = googleDriveImageUrl(property.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80');
  const landlordWhatsApp = property.landlord?.phone ?? '';
  const reviews = landlordReviews.data ?? [];
  const averageLandlordRating = reviews.length ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1) : null;
  const mapLocationParts = [
    property.address,
    property.district,
    property.city,
    'Uganda',
  ].filter((part) => typeof part === 'string' && part.trim().length > 0);
  const mapQuery = mapLocationParts.join(', ');
  const mapSearchUrl = googleMapSearchUrl(mapQuery);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user?.role === 'TENANT' && property?.id) {
      addTenantViewed(user.id, property);
      setSaved(isTenantFavorite(user.id, property.id));
    }
  }, [property?.id, user]);

  async function toggleFavorite() {
    if (user?.role !== 'TENANT') {
      setSaved((value) => !value);
      setNotice('Sign in as a tenant to keep favorites in your dashboard.');
      return;
    }
    const next = !saved;
    setSaved(next);
    if (next) addTenantFavorite(user.id, property);
    else removeTenantFavorite(user.id, property.id);
    setNotice(next ? 'Saved to your tenant dashboard.' : 'Removed from saved properties.');
    try {
      if (token && next) await api.post(`/favorites/${property.id}`);
      if (token && !next) await api.delete(`/favorites/${property.id}`);
    } catch {}
  }

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  function checkoutToWhatsApp() {
    if (!tenantName || !tenantContact || !viewingDate) {
      setNotice('Fill your name, WhatsApp/contact, and viewing date before checkout.');
      return;
    }
    if (!landlordWhatsApp) {
      setNotice('This landlord has not added a WhatsApp contact yet.');
      return;
    }
    const text = [
      `HARIS booking request`,
      `Property: ${property.title}`,
      `Rent: ${money(property.price, property.currency)} / month`,
      `Tenant: ${tenantName}`,
      `Tenant contact: ${tenantContact}`,
      `Viewing date: ${viewingDate}`,
      moveInDate ? `Preferred move-in: ${moveInDate}` : '',
      bookingNote ? `Notes: ${bookingNote}` : '',
      `Property link: ${window.location.href}`,
    ].filter(Boolean).join('\n');
    window.open(whatsappUrl(landlordWhatsApp, text), '_blank', 'noopener,noreferrer');
  }

  async function checkoutViaMobileMoney() {
    if (!token) {
      setNotice('Please sign in to proceed with Mobile Money checkout.');
      return;
    }
    if (!tenantName || !tenantContact || !viewingDate) {
      setNotice('Fill your name, contact, and viewing date before checkout.');
      return;
    }
    setCheckoutLoading(true);
    setNotice('');
    try {
      try {
         await api.post('/bookings', { propertyId: property.id, viewingDate, notes: bookingNote || `Mobile Money Checkout` });
      } catch (e) {}

      const { data } = await api.post('/payments/intent', {
        amount: Number(property.price),
        provider: 'DGATEWAY',
        propertyId: property.id,
        currency: property.currency || 'UGX',
        customerPhone: tenantContact,
        returnUrl: `${window.location.origin}/property/?id=${property.id}&payment=success`,
      });

      if (data?.metadata?.checkoutUrl) {
        window.location.href = data.metadata.checkoutUrl;
      } else {
        setNotice('Payment initialized, but no checkout URL was returned.');
      }
    } catch (error: any) {
      console.error(error);
      setNotice(error.response?.data?.message || 'Failed to initialize mobile money checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin size={16} /> {property.district}, {property.city}</p>
          </div>
          <Button className="bg-card text-foreground ring-1 ring-border" onClick={toggleFavorite}>
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
        {notice && <div className="mb-5 rounded-md border border-border bg-card px-4 py-3 text-sm text-primary">{notice}</div>}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <img src={image} alt={property.title} className="h-full w-full object-cover" />
            </div>
            {property.images?.length > 1 && (
              <div className="grid gap-3 md:grid-cols-3">
                {property.images.slice(1).map((item: any) => (
                  <img key={item.url} src={googleDriveImageUrl(item.url)} alt={item.alt ?? property.title} className="aspect-video rounded-md object-cover" />
                ))}
              </div>
            )}
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-5 border-b border-border pb-5">
                <span className="flex items-center gap-2"><BedDouble size={18} /> {property.bedrooms} bedrooms</span>
                <span className="flex items-center gap-2"><Bath size={18} /> {property.bathrooms} bathrooms</span>
                <span className="font-bold text-primary">{money(property.price, property.currency)} / month</span>
              </div>
              <p className="mt-5 leading-7 text-muted-foreground">{property.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {property.amenities?.map((amenity: any) => <span key={amenity.name} className="rounded-full bg-muted px-3 py-1 text-sm">{amenity.name}</span>)}
              </div>
            </Card>
            {property.youtubeUrls?.length ? (
              <Card className="p-6">
                <h2 className="font-semibold">Video tours</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {property.youtubeUrls.map((url: string) => (
                     <iframe key={url} className="aspect-video w-full rounded-md border border-border" src={youtubeEmbedUrl(url)} title="Property video tour" allowFullScreen />
                  ))}
                </div>
              </Card>
            ) : null}
            <Card className="p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">Location map</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{mapQuery}</p>
                </div>
                <a className="inline-flex h-10 items-center justify-center rounded-md bg-card px-4 text-sm font-semibold ring-1 ring-border transition hover:opacity-90" href={mapSearchUrl} target="_blank" rel="noreferrer">
                  Open map
                </a>
              </div>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <iframe
                  title={`${property.title} Google map`}
                  src={googleMapUrl(mapQuery, false, 15)}
                  className="h-80 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="flex items-center gap-2 font-semibold"><Navigation size={16} /> Get directions</h3>
                <p className="mt-1 text-sm text-muted-foreground">Enter your location or use GPS to get driving directions to this property.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="e.g. Kampala, Ntinda, or use GPS →"
                    value={userLocation}
                    onChange={(event) => setUserLocation(event.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    className="shrink-0 bg-card text-foreground ring-1 ring-border"
                    disabled={gpsLoading}
                    onClick={() => {
                      setGpsLoading(true);
                      if (!navigator.geolocation) {
                        setNotice('Your browser does not support GPS location.');
                        setGpsLoading(false);
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
                          setGpsLoading(false);
                          setNotice('GPS location detected! Click "Get Directions" to navigate.');
                        },
                        () => {
                          setNotice('Could not detect location. Please allow location access or type your location manually.');
                          setGpsLoading(false);
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }}
                  >
                    {gpsLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                    {gpsLoading ? 'Detecting...' : 'Use GPS'}
                  </Button>
                </div>
                <Button
                  type="button"
                  className="mt-3 w-full"
                  onClick={() => {
                    if (!userLocation.trim()) {
                      setNotice('Please enter your current location or click "Use GPS" first.');
                      return;
                    }
                    window.open(googleMapDirectionsUrl(userLocation, mapQuery), '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Navigation size={16} /> Get Directions
                </Button>
              </div>
            </Card>
            <div>
              <h2 className="mb-4 text-xl font-bold">Similar properties</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {(property.similar?.length ? property.similar : fallbackProperties.filter((item) => item.id !== property.id).slice(0, 2)).map((item: any) => <PropertyCard key={item.id} property={item} />)}
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground font-bold">{property.landlord?.firstName?.[0] ?? 'L'}</div>
                <div>
                  <p className="font-semibold">{property.landlord?.firstName} {property.landlord?.lastName}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground"><ShieldCheck size={14} /> Verified landlord</p>
                  <p className="mt-1 text-sm text-muted-foreground">{averageLandlordRating ? `${averageLandlordRating}/5 landlord rating` : 'No landlord ratings yet'}</p>
                </div>
              </div>
            </Card>
            <Card
              as="form"
              className="space-y-3 p-5"
              onSubmit={async (event: any) => {
                event.preventDefault();
                if (!landlordId) return setNotice('This listing has no landlord profile to rate.');
                try {
                  await api.post('/reviews/landlords', { landlordId, rating: Number(landlordRating), comment: landlordComment });
                  await landlordReviews.refetch();
                  setLandlordComment('');
                  setNotice('Landlord rating submitted.');
                } catch {
                  if (user?.id) {
                    addLocalReview({ landlordId, rating: Number(landlordRating), comment: landlordComment, userId: user.id });
                    setLandlordComment('');
                  }
                  setNotice('Landlord rating captured locally. Sign in as a tenant and connect the API to submit it live.');
                }
              }}
            >
              <h2 className="font-semibold">Rate this landlord</h2>
              <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={landlordRating} onChange={(event) => setLandlordRating(event.target.value)}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
              </select>
              <textarea className="min-h-24 w-full rounded-md border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Share your experience with this landlord" value={landlordComment} onChange={(event) => setLandlordComment(event.target.value)} />
              <Button type="submit" className="w-full">Submit landlord rating</Button>
            </Card>
            <Card
              as="form"
              className="space-y-3 p-5"
              onSubmit={async (event: any) => {
                event.preventDefault();
                if (!viewingDate) return setNotice('Choose a viewing date first.');
                try {
                  await api.post('/bookings', { propertyId: property.id, viewingDate, notes: bookingNote });
                  setNotice('Viewing request sent to the landlord.');
                } catch {
                  if (user?.id) {
                    addLocalBooking({ propertyId: property.id, viewingDate, notes: bookingNote, tenantId: user.id, property });
                  }
                  setNotice('Viewing request captured locally. Sign in and connect the API to send it live.');
                }
              }}
            >
              <h2 className="font-semibold">Book a viewing</h2>
              <Input placeholder="Your full name" value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
              <Input placeholder="Your WhatsApp/contact" value={tenantContact} onChange={(event) => setTenantContact(event.target.value)} />
              <Input type="datetime-local" value={viewingDate} onChange={(event) => setViewingDate(event.target.value)} />
              <Input type="date" value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} />
              <Input placeholder="Your note" value={bookingNote} onChange={(event) => setBookingNote(event.target.value)} />
              <Button type="submit" className="w-full"><CalendarDays size={17} /> Request viewing</Button>
              <div className="flex gap-2">
                <Button type="button" className="flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={checkoutLoading} onClick={checkoutViaMobileMoney}>
                  {checkoutLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : null}
                  Mobile Money Checkout
                </Button>
                <Button type="button" className="flex-1 bg-[#25D366] text-white hover:bg-[#20bd5a]" onClick={checkoutToWhatsApp}>
                  WhatsApp Checkout
                </Button>
              </div>
            </Card>
            <Card
              as="form"
              className="space-y-3 p-5"
              onSubmit={async (event: any) => {
                event.preventDefault();
                if (message.trim().length < 10) return setNotice('Please write at least 10 characters for the inquiry.');
                try {
                  await api.post('/inquiries', { propertyId: property.id, message });
                  setNotice('Inquiry sent to the landlord.');
                  setMessage('');
                } catch {
                  if (user?.id) {
                    addLocalInquiry({ propertyId: property.id, message, tenantId: user.id, property });
                    setMessage('');
                  }
                  setNotice('Inquiry captured locally. Sign in and connect the API to send it live.');
                }
              }}
            >
              <h2 className="font-semibold">Send inquiry</h2>
              <textarea className="min-h-28 w-full rounded-md border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ask about availability, terms, or move-in date" value={message} onChange={(event) => setMessage(event.target.value)} />
              <Button type="submit" className="w-full"><MessageSquare size={17} /> Contact landlord</Button>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
