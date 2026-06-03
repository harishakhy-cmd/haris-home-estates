import { Injectable } from '@nestjs/common';
import { PropertyStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async analytics() {
    const [users, properties, bookings, inquiries, activeListings, pendingLandlords, adminActions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.booking.count(),
      this.prisma.inquiry.count(),
      this.prisma.property.count({ where: { status: PropertyStatus.ACTIVE } }),
      this.prisma.user.count({ where: { role: UserRole.LANDLORD, landlordApproved: false } }),
      this.prisma.adminAction.count(),
    ]);
    return { users, properties, bookings, inquiries, activeListings, pendingLandlords, adminActions };
  }

  users() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  pendingLandlords() {
    return this.prisma.user.findMany({
      where: { role: UserRole.LANDLORD, landlordApproved: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveLandlord(actorId: string, landlordId: string, approved: boolean, reason?: string) {
    const landlord = await this.prisma.user.update({
      where: { id: landlordId },
      data: { landlordApproved: approved, verified: approved ? true : undefined, verificationBadge: approved ? true : undefined },
    });
    await this.prisma.adminAction.create({
      data: {
        actorId,
        action: approved ? 'LANDLORD_APPROVED' : 'LANDLORD_REVOKED',
        targetType: 'User',
        targetId: landlordId,
        reason,
      },
    });
    return landlord;
  }

  listings() {
    return this.prisma.property.findMany({ include: { landlord: true, images: true }, orderBy: { createdAt: 'desc' } });
  }

  async moderate(actorId: string, propertyId: string, status: PropertyStatus, reason?: string) {
    const property = await this.prisma.property.update({ where: { id: propertyId }, data: { status } });
    await this.prisma.adminAction.create({ data: { actorId, action: `LISTING_${status}`, targetType: 'Property', targetId: propertyId, reason } });
    return property;
  }

  actions() {
    return this.prisma.adminAction.findMany({
      include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async clearActions() {
    return this.prisma.adminAction.deleteMany({});
  }

  async deleteListing(actorId: string, propertyId: string) {
    const deletedProperty = await this.prisma.property.delete({
      where: { id: propertyId },
    });
    await this.prisma.adminAction.create({
      data: {
        actorId,
        action: 'LISTING_DELETED',
        targetType: 'Property',
        targetId: propertyId,
        reason: 'Admin deleted listing',
      },
    });
    return deletedProperty;
  }
}
