import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Presence Service
 * Manages online/offline status and socket connections for users
 */
@Injectable()
export class PresenceService {
  private activeUsers = new Map<string, Set<string>>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark user as online and associate socket ID
   */
  async markUserOnline(userId: string, socketId: string): Promise<void> {
    if (!this.activeUsers.has(userId)) {
      this.activeUsers.set(userId, new Set());
    }
    this.activeUsers.get(userId)!.add(socketId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: true,
        socketIds: {
          push: socketId,
        },
      },
    });
  }

  /**
   * Mark user as offline and remove socket ID
   */
  async markUserOffline(userId: string, socketId: string): Promise<void> {
    const sockets = this.activeUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.activeUsers.delete(userId);
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { socketIds: true },
    });

    if (user) {
      const updatedSocketIds = user.socketIds.filter((id) => id !== socketId);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          socketIds: updatedSocketIds,
          isOnline: updatedSocketIds.length > 0,
          lastSeen: new Date(),
        },
      });
    }
  }

  /**
   * Get all active socket IDs for a user
   */
  getUserSockets(userId: string): string[] {
    const sockets = this.activeUsers.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.activeUsers.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Get online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.activeUsers.keys());
  }

  /**
   * Clean up all presence data on startup
   */
  async cleanupAllPresence(): Promise<void> {
    this.activeUsers.clear();
    await this.prisma.user.updateMany({
      data: {
        isOnline: false,
        socketIds: [],
      },
    });
  }
}
