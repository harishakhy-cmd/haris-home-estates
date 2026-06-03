import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

class CreateReportDto {
  reason: string;
  description?: string;
}

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':userId')
  createReport(
    @CurrentUser() user: any,
    @Param('userId') reportedId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(user.id, reportedId, dto.reason, dto.description);
  }
}
