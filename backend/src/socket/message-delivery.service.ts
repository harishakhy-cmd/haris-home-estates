import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Message Delivery Service
 * Handles message status tracking: sent, delivered, read
 */
@Injectable()
export class MessageDeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark message as delivered
   */
  async markMessageDelivered(messageId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (message && message.status === 'SENT') {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });
    }
  }

  /**
   * Mark message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (message && message.status !== 'READ') {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });
    }
  }

  /**
   * Mark messages as read for a conversation
   */
  async markConversationRead(
    senderId: string,
    recipientId: string,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.message.updateMany({
      where: {
        senderId,
        recipientId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: now,
      },
    });

    // Handle view-once messages
    const viewOnceMsgs = await this.prisma.message.findMany({
      where: {
        senderId,
        recipientId,
        viewOnce: true,
        selfDestructed: false,
      },
      select: { id: true },
    });

    if (viewOnceMsgs.length > 0) {
      await this.prisma.message.updateMany({
        where: {
          id: { in: viewOnceMsgs.map((m) => m.id) },
        },
        data: {
          selfDestructed: true,
          deletedAt: now,
        },
      });
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(
    messageId: string,
  ): Promise<'SENT' | 'DELIVERED' | 'READ' | null> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { status: true },
    });

    return message?.status ?? null;
  }

  /**
   * Broadcast message delivery confirmation
   */
  broadcastDeliveryConfirmation(
    server: Server,
    messageId: string,
    recipientId: string,
  ): void {
    server.to(`user_${recipientId}`).emit('messageDelivered', {
      messageId,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast message read confirmation
   */
  broadcastReadConfirmation(
    server: Server,
    messageId: string,
    senderId: string,
  ): void {
    server.to(`user_${senderId}`).emit('messageRead', {
      messageId,
      timestamp: new Date(),
    });
  }
}
