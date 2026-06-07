import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async create(tenantId: string, dto: CreateBookingDto) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    return this.prisma.booking.create({ data: { ...dto, tenantId, landlordId: property.landlordId }, include: { property: true } });
  }

  list(user: any) {
    const where = user.role === UserRole.LANDLORD ? { landlordId: user.id } : user.role === UserRole.ADMIN ? {} : { tenantId: user.id };
    return this.prisma.booking.findMany({ where, include: { property: { include: { images: true } }, tenant: true, landlord: true }, orderBy: { viewingDate: 'desc' } });
  }

  updateStatus(id: string, status: BookingStatus) {
    return this.prisma.booking.update({ where: { id }, data: { status } }).then((booking) => {
      // Emit dashboard event for booking status change
      this.dashboardGateway.emitBookingStatusChanged({
        id: booking.id,
        status: booking.status,
        tenantId: booking.tenantId,
        landlordId: booking.landlordId,
        propertyId: booking.propertyId,
        updatedAt: booking.updatedAt,
      });
      return booking;
    });
  }
}
