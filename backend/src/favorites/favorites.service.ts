import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favorite.findMany({ where: { userId }, include: { property: { include: { images: true, amenities: true } } }, orderBy: { createdAt: 'desc' } });
  }

  add(userId: string, propertyId: string) {
    return this.prisma.favorite.upsert({ where: { userId_propertyId: { userId, propertyId } }, update: {}, create: { userId, propertyId } });
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.favorite.delete({ where: { userId_propertyId: { userId, propertyId } } });
    return { deleted: true };
  }
}
