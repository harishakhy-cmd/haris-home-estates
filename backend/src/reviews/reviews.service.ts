import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLandlordReviewDto, CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.upsert({
      where: { propertyId_userId: { propertyId: dto.propertyId, userId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: { ...dto, userId },
    });
  }

  list(propertyId: string) {
    return this.prisma.review.findMany({ where: { propertyId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
  }

  createLandlordReview(userId: string, dto: CreateLandlordReviewDto) {
    return this.prisma.landlordReview.upsert({
      where: { landlordId_userId: { landlordId: dto.landlordId, userId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: { ...dto, userId },
    });
  }

  listLandlordReviews(landlordId: string) {
    return this.prisma.landlordReview.findMany({ where: { landlordId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
  }
}
