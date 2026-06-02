import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePaymentIntentDto, PaymentWebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('intent')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createIntent(@CurrentUser() user: any, @Body() dto: CreatePaymentIntentDto) {
    return this.payments.createIntent(user, dto);
  }

  @Post('dgateway/webhook')
  handleDGatewayWebhook(@Body() dto: PaymentWebhookDto, @Headers('x-dgateway-signature') _signature?: string) {
    return this.payments.handleWebhook(dto);
  }
}
