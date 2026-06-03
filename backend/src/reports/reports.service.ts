import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(reporterId: string, reportedId: string, reason: string, description?: string) {
    if (reporterId === reportedId) {
      throw new ConflictException('You cannot report yourself');
    }

    const reportedUser = await this.prisma.user.findUnique({
      where: { id: reportedId },
    });
    if (!reportedUser) {
      throw new NotFoundException('Reported user not found');
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
        description,
      },
    });
  }
}
