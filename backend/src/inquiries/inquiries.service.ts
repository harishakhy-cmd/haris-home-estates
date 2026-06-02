import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/inquiry.dto';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateInquiryDto) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    return this.prisma.inquiry.create({ data: { ...dto, tenantId, landlordId: property.landlordId } });
  }

  list(user: any) {
    const where = user.role === UserRole.LANDLORD ? { landlordId: user.id } : user.role === UserRole.ADMIN ? {} : { tenantId: user.id };
    return this.prisma.inquiry.findMany({ where, include: { property: { include: { images: true } }, tenant: true }, orderBy: { createdAt: 'desc' } });
  }
}
