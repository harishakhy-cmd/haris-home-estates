'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Home, Receipt, Users } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { approveLocalLandlord, getLocalPendingLandlords, getLocalUsers } from '@/lib/local-auth';
import { createLocalInvoice, getLocalInvoicesForUser, localInvoiceEmailUrl, localInvoiceWhatsAppUrl, markLocalInvoicePaid } from '@/lib/local-invoices';
import { useAuthStore } from '@/store/auth-store';

export default function AdminPage() {
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [invoiceLandlordId, setInvoiceLandlordId] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('Platform service invoice');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNotice, setInvoiceNotice] = useState('');
  const [localUsers, setLocalUsers] = useState<any[]>([]);
  const [localPendingLandlords, setLocalPendingLandlords] = useState<any[]>([]);
  const [localInvoices, setLocalInvoices] = useState<any[]>([]);
  const { user, token, hydrate, logout } = useAuthStore();

  useEffect(() => {
    hydrate();
    const refreshLocalUsers = () => {
      setLocalUsers(getLocalUsers());
      setLocalPendingLandlords(getLocalPendingLandlords());
      setLocalInvoices(getLocalInvoicesForUser({ role: 'ADMIN' }));
    };
    refreshLocalUsers();
    window.addEventListener('haris-local-users', refreshLocalUsers);
    window.addEventListener('haris-local-invoices', refreshLocalUsers);
    return () => {
      window.removeEventListener('haris-local-users', refreshLocalUsers);
      window.removeEventListener('haris-local-invoices', refreshLocalUsers);
    };
  }, [hydrate]);

  const isLocalSession = Boolean(token?.startsWith('local-'));
  const enabled = Boolean(token && user?.role === 'ADMIN' && !isLocalSession);
  const queryOptions = { enabled, retry: false, refetchInterval: 5000 };
  const analytics = useQuery({ queryKey: ['admin-analytics'], queryFn: async () => (await api.get('/admin/analytics')).data, ...queryOptions });
  const users = useQuery({ queryKey: ['admin-users'], queryFn: async () => (await api.get('/admin/users')).data, ...queryOptions });
  const listings = useQuery({ queryKey: ['admin-listings'], queryFn: async () => (await api.get('/admin/listings')).data, ...queryOptions });
  const pendingLandlords = useQuery({ queryKey: ['pending-landlords'], queryFn: async () => (await api.get('/admin/landlords/pending')).data, ...queryOptions });
  const actions = useQuery({ queryKey: ['admin-actions'], queryFn: async () => (await api.get('/admin/actions')).data, ...queryOptions });
  const invoices = useQuery({ queryKey: ['admin-invoices'], queryFn: async () => (await api.get('/invoices')).data, ...queryOptions });

  const moderationQueue = useMemo(() => listings.data ?? [], [listings.data]);

  if (!token || !user) {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-muted-foreground">Sign in with an existing admin account to moderate listings, manage users, and review marketplace health.</p>
            <Link href="/auth?role=ADMIN" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Admin sign in</Link>
          </Card>
        </section>
      </main>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <main>
        <Header />
        <section className="mx-auto grid min-h-[calc(100vh-70px)] max-w-lg place-items-center px-4">
          <Card className="space-y-4 p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Admin dashboard only</h1>
            <p className="text-muted-foreground">This panel is restricted to admin accounts. Your current role is {user.role.toLowerCase()}.</p>
            <Button onClick={logout} className="w-full">Sign out</Button>
          </Card>
        </section>
      </main>
    );
  }

  const stats = [
    ['Users', analytics.data?.users ?? users.data?.length ?? localUsers.length, Users],
    ['Listings', analytics.data?.properties ?? moderationQueue.length, Home],
    ['Approved', analytics.data?.activeListings ?? moderationQueue.filter((property: any) => property.status === 'ACTIVE').length, CheckCircle2],
    ['Pending landlords', analytics.data?.pendingLandlords ?? pendingLandlords.data?.length ?? localPendingLandlords.length, AlertTriangle],
    ['Admin actions', analytics.data?.adminActions ?? actions.data?.length ?? 0, Activity],
    ['Invoices', invoices.data?.length ?? localInvoices.length, Receipt],
  ];
  const landlords = (users.data ?? localUsers ?? []).filter((item: any) => item.role === 'LANDLORD');
  const landlordApprovalQueue = pendingLandlords.data ?? localPendingLandlords;
  const visibleInvoices = invoices.data ?? localInvoices;

  async function moderate(propertyId: string, status: 'ACTIVE' | 'REJECTED') {
    setStatuses((value) => ({ ...value, [propertyId]: status === 'ACTIVE' ? 'Approved' : 'Rejected' }));
    try {
      await api.patch(`/admin/listings/${propertyId}/moderate`, { status });
      await Promise.all([listings.refetch(), analytics.refetch(), actions.refetch()]);
    } catch {
      setStatuses((value) => ({ ...value, [propertyId]: 'Action failed' }));
    }
  }

  async function approveLandlord(landlordId: string, approved: boolean) {
    try {
      if (isLocalSession) {
        approveLocalLandlord(landlordId, approved);
        setLocalUsers(getLocalUsers());
        setLocalPendingLandlords(getLocalPendingLandlords());
        return;
      }
      await api.patch(`/admin/landlords/${landlordId}/approval`, { approved });
      await Promise.all([pendingLandlords.refetch(), users.refetch(), analytics.refetch(), actions.refetch()]);
    } catch {
      // Live admin actions require the backend.
    }
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin panel</h1>
        <p className="mt-1 text-muted-foreground">Moderate listings, manage users, and watch marketplace health.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {stats.map(([label, value, Icon]: any) => (
            <Card key={label} className="p-5">
              <Icon className="text-primary" />
              <p className="mt-4 text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-8 overflow-hidden">
          <div className="border-b border-border p-5 font-semibold">Landlord approval queue</div>
          <div className="divide-y divide-border">
            {landlordApprovalQueue.map((landlord: any) => (
              <div key={landlord.id} className="grid gap-4 p-5 md:grid-cols-[1fr_260px] md:items-center">
                <div>
                  <p className="font-semibold">{landlord.firstName} {landlord.lastName}</p>
                  <p className="text-sm text-muted-foreground">{landlord.email ?? landlord.phone} · WhatsApp/contact required</p>
                </div>
                <div className="flex gap-2">
                  <Button className="h-9 flex-1" onClick={() => approveLandlord(landlord.id, true)}>Approve</Button>
                  <Button className="h-9 flex-1 bg-card text-foreground ring-1 ring-border" onClick={() => approveLandlord(landlord.id, false)}>Reject</Button>
                </div>
              </div>
            ))}
            {!landlordApprovalQueue.length && <div className="p-8 text-center text-muted-foreground">New landlord registrations awaiting approval will appear here.</div>}
          </div>
        </Card>
        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card
            as="form"
            className="space-y-3 p-5"
            onSubmit={async (event: any) => {
              event.preventDefault();
              if (!invoiceLandlordId || !invoiceAmount) return setInvoiceNotice('Choose a landlord and enter an amount.');
              try {
                await api.post('/invoices', {
                  recipientId: invoiceLandlordId,
                  title: invoiceTitle,
                  amount: Number(invoiceAmount),
                  currency: 'UGX',
                });
                setInvoiceNotice('Invoice sent to landlord.');
                setInvoiceAmount('');
                await Promise.all([invoices.refetch(), actions.refetch(), analytics.refetch()]);
              } catch {
                createLocalInvoice({
                  issuerId: user.id,
                  recipientId: invoiceLandlordId,
                  title: invoiceTitle,
                  amount: Number(invoiceAmount),
                  currency: 'UGX',
                });
                setLocalInvoices(getLocalInvoicesForUser({ role: 'ADMIN' }));
                setInvoiceNotice('Invoice sent on the platform. Use Email or WhatsApp below to share it externally.');
                setInvoiceAmount('');
              }
            }}
          >
            <div className="flex items-center gap-2 font-semibold"><Receipt size={18} /> Invoice landlord</div>
            <select className="h-11 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={invoiceLandlordId} onChange={(event) => setInvoiceLandlordId(event.target.value)}>
              <option value="">Select landlord</option>
              {landlords.map((landlord: any) => <option key={landlord.id} value={landlord.id}>{landlord.firstName} {landlord.lastName}</option>)}
            </select>
            <input className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={invoiceTitle} onChange={(event) => setInvoiceTitle(event.target.value)} placeholder="Invoice title" />
            <input className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} inputMode="numeric" placeholder="Amount" />
            {invoiceNotice && <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{invoiceNotice}</p>}
            <Button type="submit" className="w-full">Send invoice</Button>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-border p-5 font-semibold">Invoices</div>
            <div className="divide-y divide-border">
              {visibleInvoices.slice(0, 8).map((invoice: any) => (
                <div key={invoice.id} className="grid gap-2 p-4 md:grid-cols-[1fr_160px]">
                  <div>
                    <p className="font-semibold">{invoice.invoiceNo} · {invoice.title}</p>
                    <p className="text-sm text-muted-foreground">{invoice.issuer?.firstName} to {invoice.recipient?.firstName} · {invoice.status}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{Number(invoice.amount).toLocaleString()} {invoice.currency}</p>
                    <a className="inline-flex h-9 w-full items-center justify-center rounded-md bg-card px-3 text-xs font-semibold ring-1 ring-border" href={localInvoiceEmailUrl(invoice) || undefined}>
                      Email
                    </a>
                    <a className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[#25D366] px-3 text-xs font-semibold text-white" href={localInvoiceWhatsAppUrl(invoice) || undefined} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                    {invoice.id?.startsWith('local-') && invoice.status !== 'PAID' && (
                      <Button
                        type="button"
                        className="h-9 w-full bg-card px-3 text-xs text-foreground ring-1 ring-border"
                        onClick={() => {
                          markLocalInvoicePaid(invoice.id);
                          setLocalInvoices(getLocalInvoicesForUser({ role: 'ADMIN' }));
                        }}
                      >
                        Mark paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!visibleInvoices.length && <div className="p-8 text-center text-muted-foreground">Invoices created by admins and landlords will appear here.</div>}
            </div>
          </Card>
        </div>
        <Card className="mt-8 overflow-hidden">
          <div className="border-b border-border p-5 font-semibold">Listing moderation queue</div>
          <div className="divide-y divide-border">
            {moderationQueue.map((property: any) => (
              <div key={property.id} className="grid gap-4 p-5 md:grid-cols-[1fr_290px] md:items-center">
                <div>
                  <p className="font-semibold">{property.title}</p>
                  <p className="text-sm text-muted-foreground">{property.district}, {property.city} · {property.propertyType} · {statuses[property.id] ?? property.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="h-9 flex-1" onClick={() => moderate(property.id, 'ACTIVE')}>Approve</Button>
                  <Button className="h-9 flex-1 bg-card text-foreground ring-1 ring-border" onClick={() => moderate(property.id, 'REJECTED')}>Reject</Button>
                  <Button
                    className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to permanently delete this listing?')) {
                        try {
                          await api.delete(`/admin/listings/${property.id}`);
                          await Promise.all([listings.refetch(), analytics.refetch(), actions.refetch()]);
                        } catch {}
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!moderationQueue.length && <div className="p-8 text-center text-muted-foreground">Listings awaiting moderation will appear here.</div>}
          </div>
        </Card>
        <Card className="mt-8 overflow-hidden">
          <div className="border-b border-border p-5 flex items-center justify-between">
            <span className="font-semibold">Admin activity log</span>
            <Button
              className="h-8 bg-card text-foreground ring-1 ring-border text-xs px-3 hover:bg-muted"
              onClick={async () => {
                if (window.confirm('Are you sure you want to clear the admin action activity log?')) {
                  try {
                    await api.delete('/admin/actions/clear');
                    await actions.refetch();
                    await analytics.refetch();
                  } catch {}
                }
              }}
            >
              Clear history
            </Button>
          </div>
          <div className="divide-y divide-border">
            {(actions.data ?? []).map((action: any) => (
              <div key={action.id} className="grid gap-2 p-5 md:grid-cols-[1fr_180px] md:items-center">
                <div>
                  <p className="font-semibold">{action.action}</p>
                  <p className="text-sm text-muted-foreground">{action.targetType} · {action.targetId}{action.reason ? ` · ${action.reason}` : ''}</p>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(action.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!actions.data?.length && <div className="p-8 text-center text-muted-foreground">Approval and moderation actions will appear here in real time.</div>}
          </div>
        </Card>
      </section>
    </main>
  );
}
