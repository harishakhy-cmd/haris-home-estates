import { PaymentProvider } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  tenantMomoProvider?: string;
}

export class PaymentWebhookDto {
  @IsString()
  reference: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  gatewayReference?: string;
}
