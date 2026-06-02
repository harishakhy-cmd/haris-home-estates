import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateInquiryDto } from './dto/inquiry.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('Inquiries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateInquiryDto) {
    return this.inquiries.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.inquiries.list(user);
  }
}
