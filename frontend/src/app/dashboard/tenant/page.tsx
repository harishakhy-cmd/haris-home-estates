'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Heart, MessageCircle, Receipt, Search, Settings } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { getTenantFavorites, getTenantViewed, getLocalBookings, getLocalInquiries } from '@/lib/tenant-activity';
import { startDGatewayPayment } from '@/lib/payments';
import { getLocalInvoicesForUser, localInvoiceEmailUrl, localInvoiceWhatsAppUrl, markLocalInvoicePaid } from '@/lib/local-invoices';
import { useDashboard } from '@/contexts/DashboardContext';

export default function TenantDashboard() {
  const { user, token, hydrate, logout } = useAuthStore();
  const { state: dashboardState } = useDashboard();
  const [localFavorites, setLocalFavorites] = useState<any[]>([]);
  const [viewedProperties, setViewedProperties] = useState<any[]>([]);
  const [paymentNotice, setPaymentNotice] = useState('');
  const [localInvoices, setLocalInvoices] = useState<any[]>([]);
  const [localBookingsState, setLocalBookingsState] = useState<any[]>([]);
  const [localInquiriesState, setLocalInquiriesState] = useState<any[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>({});

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user?.id) return;
    const refreshActivity = () => {
      setLocalFavorites(getTenantFavorites(user.id));
      setViewedProperties(getTenantViewed(user.id));
      setLocalInvoices(getLocalInvoicesForUser(user));
      setLocalBookingsState(getLocalBookings().filter((b: any) => b.tenantId === user.id));
      setLocalInquiriesState(getLocalInquiries().filter((i: any) => i.tenantId === user.id));
    };
    refreshActivity();
    window.addEventListener('haris-tenant-activity', refreshActivity);
    window.addEventListener('haris-local-invoices', refreshActivity);
    window.addEventListener('storage', refreshActivity);
    return () => {
      window.removeEventListener('haris-tenant-activity', refreshActivity);
      window.removeEventListener('haris-local-invoices', refreshActivity);
      window.removeEventListener('storage', refreshActivity);
    };
  }, [user?.id]);

  const enabled = Boolean(token && user?.role === 'TENANT');
  const favorites = useQuery({ queryKey: ['tenant-favorites'], queryFn: async () => (await api.get('/favorites')).data, enabled, retry: false });
  const bookings = useQuery({ queryKey: ['tenant-bookings'], queryFn: async () => (await api.get('/bookings')).data, enabled, retry: false });
  const inquiries = useQuery({ queryKey: ['tenant-inquiries'], queryFn: async () => (await api.get('/inquiries')).data, enabled, retry: false });
  const messages = useQuery({ queryKey: ['tenant-messages'], queryFn: async () => (await api.get('/messages')).data, enabled, retry: false });
  const invoices = useQuery({ queryKey: ['tenant-invoices'], queryFn: async () => (await api.get('/invoices')).data, enabled, retry: false, refetchInterval: 5000 });

  const savedProperties = useMemo(() => {
    const apiFavorites = (favorites.data ?? []).map((favorite: any) => favorite.property).filter(Boolean);
    const byId = new Map<string, any>();
    [...localFavorites, ...apiFavorites].forEach((property: any) => {
      if (property?.id) byId.set(property.id, property);
    });
    return Array.from(byId.values());
  }, [favorites.data, localFavorites]);

  // Combine API bookings with dashboard real-time updates
  const allBookings =
    dashboardState.bookings.length > 0
      ? dashboardState.bookings.filter((b: any) => b.tenantId === user?.id)
      : bookings.data?.length
        ? bookings.data
        : localBookingsState;

  const visibleInvoices = invoices.data?.length ? invoices.data : localInvoices;
  const visibleBookings = allBookings;
  const visibleInquiries = inquiries.data?.length ? inquiries.data : localInquiriesState;
  const stats = [
    ['Saved', savedProperties.length, Heart],
    ['Viewed', viewedProperties.length, Search],
    ['Bookings', visibleBookings.length, CalendarCheck],
    ['Invoices', visibleInvoices.length, Receipt],
  ];

  if (!token || !user) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Tenant access required</h1>
            <p className="text-muted-foreground">Register or sign in as a tenant to see saved properties, bookings, inquiries, and messages tied to your activity.</p>
            <Link href="/auth" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Register or sign in</Link>
          </Card>
        </section>
      </main>
    );
  }

  if (user.role !== 'TENANT') {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Tenant dashboard only</h1>
            <p className="text-muted-foreground">This dashboard is reserved for tenant accounts. Use the proper dashboard for your current role.</p>
            <Button onClick={logout} className="w-full">Sign out</Button>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Tenant dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome back, {user.firstName}. This dashboard follows your saved homes, bookings, inquiries, and messages.</p>
          </div>
          <Link href="/properties" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"><Search size={17} /> Find rentals</Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {stats.map(([label, value, Icon]: any) => (
            <Card key={label} className="p-5">
              <Icon className="text-primary" />
              <p className="mt-4 text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="mb-4 text-xl font-bold">Saved properties</h2>
            {savedProperties.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {savedProperties.map((property: any) => <PropertyCard key={property.id} property={property} />)}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">Saved homes will appear here after you tap the heart on a listing.</Card>
            )}
            <h2 className="mb-4 mt-8 text-xl font-bold">Recently viewed</h2>
            {viewedProperties.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {viewedProperties.map((property: any) => <PropertyCard key={property.id} property={property} />)}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">Viewed properties will appear here after you open a listing detail page.</Card>
            )}
          </div>
          <div className="space-y-5">
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><CalendarCheck size={18} /> Viewing bookings</div>
              <div className="space-y-3">
                {visibleBookings.slice(0, 4).map((booking: any) => (
                  <div key={booking.id} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-semibold">{booking.property?.title ?? 'Property viewing'}</p>
                    <p className="text-muted-foreground">{new Date(booking.viewingDate).toLocaleString()} · {booking.status}</p>
                  </div>
                ))}
                {!visibleBookings.length && <p className="text-sm text-muted-foreground">No viewing bookings yet.</p>}
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><Receipt size={18} /> Invoices</div>
              {paymentNotice && <p className="mb-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{paymentNotice}</p>}
              <div className="space-y-3">
                {visibleInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-semibold">{invoice.invoiceNo} · {invoice.title}</p>
                    <p className="text-muted-foreground">{Number(invoice.amount).toLocaleString()} {invoice.currency} · {invoice.status}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <a className="inline-flex h-9 items-center justify-center rounded-md bg-card px-3 text-xs font-semibold ring-1 ring-border" href={localInvoiceEmailUrl(invoice) || undefined}>
                        Email copy
                      </a>
                      <a className="inline-flex h-9 items-center justify-center rounded-md bg-[#25D366] px-3 text-xs font-semibold text-white" href={localInvoiceWhatsAppUrl(invoice) || undefined} target="_blank" rel="noreferrer">
                        WhatsApp copy
                      </a>
                    </div>
                    {invoice.status !== 'PAID' && (
                      <div className="mt-3 space-y-2">
                        <select 
                          className="w-full h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                          value={selectedProviders[invoice.id] || ''}
                          onChange={(e) => setSelectedProviders(prev => ({ ...prev, [invoice.id]: e.target.value }))}
                        >
                          <option value="">Select Mobile Money Provider</option>
                          <option value="MTN_MOMO">MTN MoMo</option>
                          <option value="AIRTEL_MONEY">Airtel Money</option>
                        </select>
                        <Button
                          type="button"
                          className="h-9 w-full"
                          disabled={!selectedProviders[invoice.id]}
                          onClick={async () => {
                            try {
                              await startDGatewayPayment(invoice, window.location.href, selectedProviders[invoice.id]);
                              setPaymentNotice('Payment session created.');
                            } catch {
                              setPaymentNotice('DGateway payment structure is ready. Connect the backend and live gateway credentials to process this invoice.');
                            }
                          }}
                        >
                          Pay with mobile money
                        </Button>
                      </div>
                    )}
                    {invoice.id?.startsWith('local-') && invoice.status !== 'PAID' && (
                      <Button
                        type="button"
                        className="mt-2 h-9 w-full bg-card text-foreground ring-1 ring-border"
                        onClick={() => {
                          markLocalInvoicePaid(invoice.id);
                          setLocalInvoices(getLocalInvoicesForUser(user));
                        }}
                      >
                        Mark paid on platform
                      </Button>
                    )}
                  </div>
                ))}
                {!visibleInvoices.length && <p className="text-sm text-muted-foreground">Invoices from landlords will appear here.</p>}
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><MessageCircle size={18} /> Recent activity</div>
              <div className="space-y-3">
                {visibleInquiries.slice(0, 3).map((inquiry: any) => (
                  <div key={inquiry.id} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-semibold">{inquiry.property?.title ?? 'Inquiry'}</p>
                    <p className="line-clamp-2 text-muted-foreground">{inquiry.message}</p>
                  </div>
                ))}
                {!visibleInquiries.length && <p className="text-sm text-muted-foreground">Inquiries and landlord replies will appear here.</p>}
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><Settings size={18} /> Profile</div>
              <p className="text-sm text-muted-foreground">{user.email ?? user.phone}</p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
