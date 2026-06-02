import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePropertyDto, PropertyFilterDto, UpdatePropertyDto } from './dto/property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  findAll(@Query() filter: PropertyFilterDto) {
    return this.properties.findAll(filter);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreatePropertyDto) {
    if (user.role === UserRole.LANDLORD && !user.landlordApproved) {
      throw new ForbiddenException('Landlord account is awaiting admin approval');
    }
    return this.properties.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @Get('mine/list')
  mine(@CurrentUser() user: any) {
    return this.properties.landlordProperties(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.properties.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.properties.remove(user, id);
  }
}
