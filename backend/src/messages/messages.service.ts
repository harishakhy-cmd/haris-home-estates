import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(senderId: string, dto: CreateMessageDto) {
    return this.prisma.message.create({ data: { ...dto, senderId } });
  }

  inbox(userId: string) {
    return this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      include: { sender: true, recipient: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
