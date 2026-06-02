'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarCheck, Eye, Home, Inbox, Percent, Receipt } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { getLocalUsers } from '@/lib/local-auth';
import { createLocalInvoice, getLocalInvoicesForUser, localInvoiceEmailUrl, localInvoiceWhatsAppUrl, markLocalInvoicePaid } from '@/lib/local-invoices';
import { deleteLocalProperty, getLocalProperties } from '@/lib/local-properties';
import { fallbackProperties } from '@/lib/mock-data';
import { startDGatewayPayment } from '@/lib/payments';
import { useAuthStore } from '@/store/auth-store';
import { getLocalBookings, getLocalInquiries } from '@/lib/tenant-activity';

export default function LandlordDashboard() {
  const { user, token, hydrate, logout } = useAuthStore();
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [invoiceTenantId, setInvoiceTenantId] = useState('');
  const [invoicePropertyId, setInvoicePropertyId] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('Rent invoice');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNotice, setInvoiceNotice] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [localUsers, setLocalUsers] = useState<any[]>([]);
  const [localInvoices, setLocalInvoices] = useState<any[]>([]);
  const [localProperties, setLocalProperties] = useState<any[]>([]);
  const [localBookingsState, setLocalBookingsState] = useState<any[]>([]);
  const [localInquiriesState, setLocalInquiriesState] = useState<any[]>([]);
  
  const [momoNumber, setMomoNumber] = useState('');
  const [momoProvider, setMomoProvider] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('MOMO');
  const [momoNotice, setMomoNotice] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    const refreshLocalData = () => {
      setLocalUsers(getLocalUsers());
      setLocalInvoices(getLocalInvoicesForUser(user));
      setLocalProperties(getLocalProperties());
      
      const lBookings = getLocalBookings().filter((b: any) => b.property?.landlord?.id === user.id || b.property?.landlordId === user.id);
      setLocalBookingsState(lBookings);
      
      const lInquiries = getLocalInquiries().filter((i: any) => i.property?.landlord?.id === user.id || i.property?.landlordId === user.id);
      setLocalInquiriesState(lInquiries);
      if (user?.momoNumber) setMomoNumber(user.momoNumber);
      if (user?.momoProvider) setMomoProvider(user.momoProvider);
      if (user?.bankName) setBankName(user.bankName);
      if (user?.bankAccount) setBankAccount(user.bankAccount);
      if (user?.paymentPreference) setPaymentPreference(user.paymentPreference);
    };
    refreshLocalData();
    window.addEventListener('haris-local-invoices', refreshLocalData);
    window.addEventListener('haris-local-users', refreshLocalData);
    window.addEventListener('haris-local-properties', refreshLocalData);
    return () => {
      window.removeEventListener('haris-local-invoices', refreshLocalData);
      window.removeEventListener('haris-local-users', refreshLocalData);
      window.removeEventListener('haris-local-properties', refreshLocalData);
    };
  }, [user]);

  const isLocalSession = Boolean(token?.startsWith('local-'));
  const enabled = Boolean(token && user?.role === 'LANDLORD' && !isLocalSession);
  const queryOptions = { enabled, retry: false, refetchInterval: 5000 };
  const properties = useQuery({ queryKey: ['landlord-properties'], queryFn: async () => (await api.get('/properties/mine/list')).data, ...queryOptions });
  const inquiries = useQuery({ queryKey: ['landlord-inquiries'], queryFn: async () => (await api.get('/inquiries')).data, ...queryOptions });
  const bookings = useQuery({ queryKey: ['landlord-bookings'], queryFn: async () => (await api.get('/bookings')).data, ...queryOptions });
  const invoices = useQuery({ queryKey: ['landlord-invoices'], queryFn: async () => (await api.get('/invoices')).data, ...queryOptions });

  const localLandlordProperties = [...localProperties, ...fallbackProperties].filter((property: any) => {
    const landlordName = `${property.landlord?.firstName ?? ''} ${property.landlord?.lastName ?? ''}`.trim().toLowerCase();
    const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim().toLowerCase();
    return property.landlord?.id === user?.id || landlordName === userName;
  });
  const landlordProperties = ((properties.data?.length ? properties.data : localLandlordProperties) ?? []).filter((property: any) => !removedIds.includes(property.id));
  const visibleInvoices = invoices.data?.length ? invoices.data : localInvoices;
  const visibleBookings = bookings.data?.length ? bookings.data : localBookingsState;
  const visibleInquiries = inquiries.data?.length ? inquiries.data : localInquiriesState;
  const occupancy = useMemo(() => {
    const units = landlordProperties.flatMap((property: any) => property.units ?? []);
    if (!units.length) return 0;
    return Math.round((units.filter((unit: any) => unit.occupied).length / units.length) * 100);
  }, [landlordProperties]);

  if (!token || !user) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Landlord access required</h1>
            <p className="text-muted-foreground">Register or sign in as a landlord to manage listings, inquiries, bookings, and occupancy.</p>
            <Link href="/auth?role=LANDLORD" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Register or sign in</Link>
          </Card>
        </section>
      </main>
    );
  }

  if (user.role !== 'LANDLORD') {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Landlord dashboard only</h1>
            <p className="text-muted-foreground">This area is reserved for landlord accounts. Use the dashboard for your current role or sign in with a landlord account.</p>
            <Button onClick={logout} className="w-full">Sign out</Button>
          </Card>
        </section>
      </main>
    );
  }

  if (!user.landlordApproved) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Awaiting admin approval</h1>
            <p className="text-muted-foreground">Your landlord account has been created, but admin approval is required before you can add or manage properties.</p>
            <Button onClick={logout} className="w-full">Sign out</Button>
          </Card>
        </section>
      </main>
    );
  }

  const stats = [
    ['Active listings', landlordProperties.filter((property: any) => property.status === 'ACTIVE').length, Home],
    ['Occupancy', `${occupancy}%`, Percent],
    ['Open inquiries', visibleInquiries.length, Inbox],
    ['Viewings', visibleBookings.length, Eye],
    ['Invoices', visibleInvoices.length, Receipt],
  ];
  const bookedTenants = Array.from(new Map((visibleBookings).map((booking: any) => [booking.tenantId, booking.tenant || localUsers.find((u:any) => u.id === booking.tenantId)])).values()).filter(Boolean);
  const localTenants = localUsers.filter((item: any) => item.role === 'TENANT');
  const tenantOptions = Array.from(new Map([...bookedTenants, ...localTenants].map((tenant: any) => [tenant.id, tenant])).values());

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Landlord dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome back, {user.firstName}. Manage listings, occupancy, tenant interest, and viewing requests.</p>
          </div>
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90" href="/dashboard/landlord/new">
            <Building2 size={17} /> New listing
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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
            <h2 className="mb-4 text-xl font-bold">Your properties</h2>
            {landlordProperties.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {landlordProperties.map((property: any) => (
                  <div key={property.id} className="overflow-hidden rounded-lg border border-border bg-card">
                    <PropertyCard property={property} />
                    <div className="grid gap-2 border-t border-border p-3 md:grid-cols-2">
                      <Link href={`/dashboard/landlord/new?edit=${property.id}`} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Edit elements</Link>
                      <Button
                        type="button"
                        className="h-10 bg-card text-foreground ring-1 ring-border"
                        onClick={async () => {
                          setRemovedIds((ids) => [...ids, property.id]);
                          try { await api.delete(`/properties/${property.id}`); await properties.refetch(); } catch {}
                          deleteLocalProperty(property.id);
                        }}
                      >
                        Remove listing
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">Your listings will appear here after you create your first property.</Card>
            )}
          </div>
          <div className="space-y-5">
            <Card as="form" className="space-y-3 p-5" action="/dashboard/landlord/new">
              <h2 className="font-semibold">Quick listing draft</h2>
              <Input name="title" placeholder="Property title" />
              <Input name="rent" placeholder="Monthly rent" />
              <Input name="location" placeholder="City or district" />
              <Button type="submit" className="w-full">Continue draft</Button>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><CalendarCheck size={18} /> Recent viewing requests</div>
              <div className="space-y-3">
                {(bookings.data ?? []).slice(0, 4).map((booking: any) => (
                  <div key={booking.id} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-semibold">{booking.property?.title ?? 'Property viewing'}</p>
                    <p className="text-muted-foreground">{new Date(booking.viewingDate).toLocaleString()} · {booking.status}</p>
                  </div>
                ))}
                {!bookings.data?.length && <p className="text-sm text-muted-foreground">Viewing requests from tenants will appear here.</p>}
              </div>
            </Card>
            <Card
              as="form"
              className="space-y-3 p-5"
              onSubmit={async (event: any) => {
                event.preventDefault();
                try {
                  await api.patch('/users/me', { momoNumber, momoProvider, bankName, bankAccount, paymentPreference });
                  setMomoNotice('Payment details saved successfully.');
                  const updatedUser = { ...user, momoNumber, momoProvider, bankName, bankAccount, paymentPreference };
                  useAuthStore.setState({ user: updatedUser });
                } catch {
                  setMomoNotice('Failed to save payment details.');
                }
              }}
            >
              <div className="flex items-center gap-2 font-semibold"><Percent size={18} /> Payment Setup</div>
              <p className="text-xs text-muted-foreground">Configure how you receive rent payments.</p>
              
              <select className="w-full h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={paymentPreference} onChange={(event) => setPaymentPreference(event.target.value)}>
                <option value="MOMO">Mobile Money</option>
                <option value="BANK">Bank Account</option>
              </select>

              {paymentPreference === 'MOMO' ? (
                <>
                  <select className="w-full h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={momoProvider} onChange={(event) => setMomoProvider(event.target.value)} required>
                    <option value="">Select MoMo Provider</option>
                    <option value="MTN_MOMO">MTN MoMo</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                  </select>
                  <Input value={momoNumber} onChange={(event) => setMomoNumber(event.target.value)} placeholder="Phone number (e.g., +256...)" required />
                </>
              ) : (
                <>
                  <Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Bank Name (e.g. Centenary Bank)" required />
                  <Input value={bankAccount} onChange={(event) => setBankAccount(event.target.value)} placeholder="Account Number" required />
                </>
              )}

              {momoNotice && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{momoNotice}</p>}
              <Button type="submit" className="w-full">Save Details</Button>
            </Card>
            <Card
              as="form"
              className="space-y-3 p-5"
              onSubmit={async (event: any) => {
                event.preventDefault();
                if (!invoiceTenantId || !invoiceAmount) return setInvoiceNotice('Choose a tenant and enter an amount.');
                try {
                  await api.post('/invoices', {
                    recipientId: invoiceTenantId,
                    propertyId: invoicePropertyId || undefined,
                    title: invoiceTitle,
                    amount: Number(invoiceAmount),
                    currency: 'UGX',
                  });
                  setInvoiceNotice('Invoice sent to tenant.');
                  setInvoiceAmount('');
                  await invoices.refetch();
                } catch {
                  createLocalInvoice({
                    issuerId: user.id,
                    recipientId: invoiceTenantId,
                    propertyId: invoicePropertyId || undefined,
                    title: invoiceTitle,
                    amount: Number(invoiceAmount),
                    currency: 'UGX',
                  });
                  setLocalInvoices(getLocalInvoicesForUser(user));
                  setInvoiceAmount('');
                  setInvoiceNotice('Invoice sent on the platform. Use Email or WhatsApp below to share it externally.');
                }
              }}
            >
              <div className="flex items-center gap-2 font-semibold"><Receipt size={18} /> Invoice tenant</div>
              <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={invoiceTenantId} onChange={(event) => setInvoiceTenantId(event.target.value)}>
                <option value="">Select tenant</option>
                {tenantOptions.map((tenant: any) => <option key={tenant.id} value={tenant.id}>{tenant.firstName} {tenant.lastName}</option>)}
              </select>
              <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={invoicePropertyId} onChange={(event) => setInvoicePropertyId(event.target.value)}>
                <option value="">Optional property</option>
                {landlordProperties.map((property: any) => <option key={property.id} value={property.id}>{property.title}</option>)}
              </select>
              <Input value={invoiceTitle} onChange={(event) => setInvoiceTitle(event.target.value)} placeholder="Invoice title" />
              <Input value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} inputMode="numeric" placeholder="Amount" />
              {invoiceNotice && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{invoiceNotice}</p>}
              <Button type="submit" className="w-full">Send invoice</Button>
            </Card>
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><Receipt size={18} /> Sent and received invoices</div>
              {paymentNotice && <p className="mb-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{paymentNotice}</p>}
              <div className="space-y-3">
                {visibleInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-semibold">{invoice.invoiceNo} · {invoice.title}</p>
                    <p className="text-muted-foreground">{Number(invoice.amount).toLocaleString()} {invoice.currency} · {invoice.status}</p>
                    <div className="mt-3 grid gap-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <a className="inline-flex h-9 items-center justify-center rounded-md bg-card px-3 text-xs font-semibold ring-1 ring-border" href={localInvoiceEmailUrl(invoice) || undefined}>
                          Send by email
                        </a>
                        <a className="inline-flex h-9 items-center justify-center rounded-md bg-[#25D366] px-3 text-xs font-semibold text-white" href={localInvoiceWhatsAppUrl(invoice) || undefined} target="_blank" rel="noreferrer">
                          Send by WhatsApp
                        </a>
                      </div>
                      {invoice.id?.startsWith('local-') && invoice.status !== 'PAID' && (
                        <Button
                          type="button"
                          className="h-9 bg-card text-foreground ring-1 ring-border"
                          onClick={() => {
                            markLocalInvoicePaid(invoice.id);
                            setLocalInvoices(getLocalInvoicesForUser(user));
                          }}
                        >
                          Mark paid on platform
                        </Button>
                      )}
                    </div>
                    {invoice.recipientId === user.id && invoice.status !== 'PAID' && (
                      <Button
                        type="button"
                        className="mt-3 h-9 w-full"
                        onClick={async () => {
                          try {
                            await startDGatewayPayment(invoice, window.location.href);
                            setPaymentNotice('DGateway payment session created.');
                          } catch {
                            setPaymentNotice('DGateway payment structure is ready. Connect the backend and live gateway credentials to process this invoice.');
                          }
                        }}
                      >
                        Pay with DGateway
                      </Button>
                    )}
                  </div>
                ))}
                {!visibleInvoices.length && <p className="text-sm text-muted-foreground">Invoices will appear here.</p>}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
