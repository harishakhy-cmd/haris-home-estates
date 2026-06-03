import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { ApproveLandlordDto, ModerateListingDto } from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('analytics')
  analytics() {
    return this.admin.analytics();
  }

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Get('landlords/pending')
  pendingLandlords() {
    return this.admin.pendingLandlords();
  }

  @Patch('landlords/:id/approval')
  approveLandlord(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ApproveLandlordDto) {
    return this.admin.approveLandlord(user.id, id, dto.approved, dto.reason);
  }

  @Get('listings')
  listings() {
    return this.admin.listings();
  }

  @Get('actions')
  actions() {
    return this.admin.actions();
  }

  @Delete('actions/clear')
  clearActions() {
    return this.admin.clearActions();
  }

  @Patch('listings/:id/moderate')
  moderate(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ModerateListingDto) {
    return this.admin.moderate(user.id, id, dto.status, dto.reason);
  }

  @Delete('listings/:id')
  deleteListing(@CurrentUser() user: any, @Param('id') id: string) {
    return this.admin.deleteListing(user.id, id);
  }
}
