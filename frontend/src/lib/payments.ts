import { api } from './api';

export async function startDGatewayPayment(invoice: any, returnUrl?: string, tenantMomoProvider?: string) {
  const { data } = await api.post('/payments/intent', {
    provider: 'DGATEWAY',
    invoiceId: invoice.id,
    amount: Number(invoice.amount),
    currency: invoice.currency ?? 'UGX',
    propertyId: invoice.propertyId,
    returnUrl,
    tenantMomoProvider,
  });
  const checkoutUrl = data?.metadata?.checkoutUrl;
  if (checkoutUrl) window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  return data;
}
