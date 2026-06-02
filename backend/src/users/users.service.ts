import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, whatsapp: true, avatarUrl: true, momoNumber: true, momoProvider: true, bankName: true, bankAccount: true, paymentPreference: true, role: true, verified: true, verificationBadge: true, landlordApproved: true, bio: true, location: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  update(id: string, data: any) {
    const { passwordHash, role, verified, ...safe } = data;
    return this.prisma.user.update({
      where: { id },
      data: safe,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, whatsapp: true, avatarUrl: true, momoNumber: true, momoProvider: true, bankName: true, bankAccount: true, paymentPreference: true, role: true, verified: true, verificationBadge: true, landlordApproved: true, bio: true, location: true, createdAt: true, updatedAt: true },
    });
  }
}
