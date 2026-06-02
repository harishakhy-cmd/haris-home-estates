import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.invoices.list(user);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoices.updateStatus(user, id, dto.status);
  }
}
