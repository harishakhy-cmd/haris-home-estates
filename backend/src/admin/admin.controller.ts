import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PropertyStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

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
  approveLandlord(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { approved: boolean; reason?: string }) {
    return this.admin.approveLandlord(user.id, id, body.approved, body.reason);
  }

  @Get('listings')
  listings() {
    return this.admin.listings();
  }

  @Get('actions')
  actions() {
    return this.admin.actions();
  }

  @Patch('listings/:id/moderate')
  moderate(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: PropertyStatus; reason?: string }) {
    return this.admin.moderate(user.id, id, body.status, body.reason);
  }
}
