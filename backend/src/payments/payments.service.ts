import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceStatus, PaymentProvider, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentIntentDto, PaymentWebhookDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createIntent(user: any, dto: CreatePaymentIntentDto) {
    const invoice = dto.invoiceId
      ? await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId }, include: { recipient: true, property: true, issuer: true } })
      : null;

    if (dto.invoiceId && !invoice) throw new NotFoundException('Invoice not found');
    if (invoice && invoice.recipientId !== user.id && invoice.issuerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    const amount = invoice ? Number(invoice.amount) : dto.amount;
    const currency = invoice?.currency ?? dto.currency ?? 'UGX';
    const reference = `HARIS-${randomUUID()}`;
    const gateway = await this.initializeGatewayPayment({
      amount,
      currency,
      reference,
      provider: dto.provider,
      customerEmail: dto.customerEmail ?? user.email,
      customerPhone: dto.customerPhone ?? user.phone,
      returnUrl: dto.returnUrl,
      description: invoice ? invoice.title : 'HARIS payment',
      tenantMomoProvider: dto.tenantMomoProvider,
      splits: invoice ? [
        { account: '+256750879188', amount: amount * 0.06, provider: 'AIRTEL_MONEY', note: 'Airtel fee' },
        { account: 'DGATEWAY', amount: amount * 0.08, note: 'DGateway fee' },
        { 
          account: invoice.issuer?.paymentPreference === 'BANK' ? (invoice.issuer?.bankAccount || 'DEFAULT_BANK_ACCOUNT') : (invoice.issuer?.momoNumber || 'DEFAULT_ACCOUNT'), 
          amount: amount * 0.86, 
          provider: invoice.issuer?.paymentPreference === 'BANK' ? (invoice.issuer?.bankName || 'BANK') : (invoice.issuer?.momoProvider || 'UNKNOWN'), 
          note: 'Landlord payout' 
        }
      ] : undefined,
    });

    return this.prisma.payment.create({
      data: {
        userId: user.id,
        propertyId: dto.propertyId ?? invoice?.propertyId,
        amount,
        provider: dto.provider,
        currency,
        status: PaymentStatus.INITIATED,
        reference,
        metadata: {
          invoiceId: dto.invoiceId,
          checkoutUrl: gateway.checkoutUrl,
          gatewayReference: gateway.gatewayReference,
          mode: gateway.mode,
          note: 'Future-ready DGateway handoff. Enable live mode with DGATEWAY_* environment variables.',
        },
      },
    });
  }

  async handleWebhook(dto: PaymentWebhookDto) {
    const status = this.mapGatewayStatus(dto.status);
    const existing = await this.prisma.payment.findUnique({ where: { reference: dto.reference } });
    if (!existing) throw new NotFoundException('Payment not found');
    const metadata = existing.metadata as { invoiceId?: string } | null;
    const payment = await this.prisma.payment.update({
      where: { reference: dto.reference },
      data: {
        status,
        metadata: {
          ...(metadata ?? {}),
          gatewayReference: dto.gatewayReference,
          gatewayStatus: dto.status,
          receivedAt: new Date().toISOString(),
        },
      },
    });

    if (status === PaymentStatus.SUCCEEDED && metadata?.invoiceId) {
      await this.prisma.invoice.update({ where: { id: metadata.invoiceId }, data: { status: InvoiceStatus.PAID } });
    }

    return { ok: true, reference: payment.reference, status };
  }

  private async initializeGatewayPayment(input: {
    amount: number;
    currency: string;
    reference: string;
    provider: PaymentProvider;
    customerEmail?: string | null;
    customerPhone?: string | null;
    returnUrl?: string;
    description: string;
    tenantMomoProvider?: string;
    splits?: Array<{ account: string; amount: number; provider?: string; note?: string }>;
  }) {
    if (input.provider !== PaymentProvider.DGATEWAY) {
      return {
        mode: 'structured',
        gatewayReference: input.reference,
        checkoutUrl: input.returnUrl,
      };
    }

    const mode = this.config.get<string>('DGATEWAY_MODE', 'mock');
    const baseUrl = this.config.get<string>('DGATEWAY_BASE_URL');
    const apiKey = this.config.get<string>('DGATEWAY_API_KEY');
    const merchantId = this.config.get<string>('DGATEWAY_MERCHANT_ID');
    const callbackUrl = this.config.get<string>('DGATEWAY_CALLBACK_URL');
    const returnUrl = input.returnUrl ?? this.config.get<string>('DGATEWAY_RETURN_URL');

    if (mode !== 'live' || !baseUrl || !apiKey || !merchantId) {
      return {
        mode: 'mock',
        gatewayReference: `DGW-MOCK-${input.reference}`,
        checkoutUrl: `${returnUrl ?? 'https://harisv2.web.app'}/profile?payment=${encodeURIComponent(input.reference)}`,
      };
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/payments/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId,
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        customer: {
          email: input.customerEmail,
          phone: input.customerPhone,
        },
        callbackUrl,
        returnUrl,
        provider: input.tenantMomoProvider,
        splits: input.splits,
      }),
    });

    if (!response.ok) {
      throw new Error(`DGateway initialization failed with ${response.status}`);
    }

    const payload = await response.json();
    return {
      mode: 'live',
      gatewayReference: payload.gatewayReference ?? payload.reference ?? input.reference,
      checkoutUrl: payload.checkoutUrl ?? payload.paymentUrl,
    };
  }

  private mapGatewayStatus(status: string) {
    const normalized = status.toUpperCase();
    if (['SUCCESS', 'SUCCEEDED', 'PAID', 'COMPLETED'].includes(normalized)) return PaymentStatus.SUCCEEDED;
    if (['FAILED', 'DECLINED', 'CANCELLED', 'CANCELED'].includes(normalized)) return PaymentStatus.FAILED;
    if (['REFUNDED', 'REVERSED'].includes(normalized)) return PaymentStatus.REFUNDED;
    return PaymentStatus.PENDING;
  }
}
