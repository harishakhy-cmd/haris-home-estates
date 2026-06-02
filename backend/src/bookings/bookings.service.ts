import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.booking.update({ where: { id }, data: { status } });
  }
}
