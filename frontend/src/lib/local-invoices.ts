import { getLocalUsers } from './local-auth';

const INVOICES_KEY = 'haris_local_invoices';

type LocalInvoiceInput = {
  issuerId: string;
  recipientId: string;
  propertyId?: string;
  title: string;
  amount: number;
  currency?: string;
  description?: string;
};

function readInvoices() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(INVOICES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeInvoices(invoices: any[]) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new Event('haris-local-invoices'));
}

function invoiceText(invoice: any) {
  return [
    'HARIS invoice',
    `Invoice: ${invoice.invoiceNo}`,
    `Title: ${invoice.title}`,
    `Amount: ${Number(invoice.amount).toLocaleString()} ${invoice.currency}`,
    invoice.description ? `Details: ${invoice.description}` : '',
    `Issuer: ${invoice.issuer?.firstName ?? 'HARIS'} ${invoice.issuer?.lastName ?? ''}`.trim(),
    'Please sign in to HARIS to review this invoice on the platform.',
  ].filter(Boolean).join('\n');
}

export function createLocalInvoice(input: LocalInvoiceInput) {
  const users = getLocalUsers();
  const issuer = users.find((item: any) => item.id === input.issuerId);
  const recipient = users.find((item: any) => item.id === input.recipientId);
  const invoices = readInvoices();
  const invoice = {
    id: `local-invoice-${Date.now()}`,
    invoiceNo: `HARIS-LOCAL-${String(invoices.length + 1).padStart(5, '0')}`,
    issuerId: input.issuerId,
    recipientId: input.recipientId,
    propertyId: input.propertyId,
    title: input.title,
    description: input.description,
    amount: input.amount,
    currency: input.currency ?? 'UGX',
    status: 'SENT',
    issuer,
    recipient,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeInvoices([invoice, ...invoices]);
  return invoice;
}

export function getLocalInvoicesForUser(user: any) {
  const invoices = readInvoices();
  if (user?.role === 'ADMIN') return invoices;
  return invoices.filter((invoice: any) => invoice.issuerId === user?.id || invoice.recipientId === user?.id);
}

export function markLocalInvoicePaid(invoiceId: string) {
  const invoices = readInvoices().map((invoice: any) => (
    invoice.id === invoiceId ? { ...invoice, status: 'PAID', updatedAt: new Date().toISOString() } : invoice
  ));
  writeInvoices(invoices);
}

export function localInvoiceEmailUrl(invoice: any) {
  const email = invoice.recipient?.email;
  if (!email) return '';
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(invoice.title)}&body=${encodeURIComponent(invoiceText(invoice))}`;
}

export function localInvoiceWhatsAppUrl(invoice: any) {
  const phone = invoice.recipient?.phone;
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(invoiceText(invoice))}`;
}
