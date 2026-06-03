import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/* In-memory online presence store ----------------------------------- */
const onlineUserIds = new Set<string>();

export function markUserOnline(userId: string) { onlineUserIds.add(userId); }
export function markUserOffline(userId: string) { onlineUserIds.delete(userId); }
export function getOnlineUserIds(): string[] { return [...onlineUserIds]; }

const SELECT_PUBLIC = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  whatsapp: true,
  avatarUrl: true,
  momoNumber: true,
  momoProvider: true,
  bankName: true,
  bankAccount: true,
  paymentPreference: true,
  role: true,
  verified: true,
  verificationBadge: true,
  landlordApproved: true,
  bio: true,
  location: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELECT_PUBLIC,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  update(id: string, data: any) {
    const { passwordHash, role, verified, ...safe } = data;
    return this.prisma.user.update({
      where: { id },
      data: safe,
      select: SELECT_PUBLIC,
    });
  }

  /** Search users by first name, last name, or email (case-insensitive). */
  async search(q: string, excludeId?: string) {
    const term = q?.trim() ?? '';
    return this.prisma.user.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        OR: term
          ? [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName:  { contains: term, mode: 'insensitive' } },
              { email:     { contains: term, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
      take: 30,
      orderBy: { firstName: 'asc' },
    });
  }

  /** Return list of currently online user IDs. */
  online(): string[] {
    return getOnlineUserIds();
  }
}
