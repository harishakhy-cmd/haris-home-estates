import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new ConflictException('You cannot send a friend request to yourself');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundException('Target user not found');
    }

    // Check if blocked by either side
    const isBlocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (isBlocked) {
      throw new ForbiddenException('Unable to send request due to active blocks');
    }

    // Check existing friendship
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends with this user');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === senderId) {
          throw new ConflictException('Friend request is already pending');
        } else {
          // If the other user already sent a request to us, accept it automatically!
          return this.acceptRequest(senderId, receiverId);
        }
      }
      // If it was declined, reset status to PENDING
      return this.prisma.friendship.update({
        where: { id: existing.id },
        data: {
          senderId,
          receiverId,
          status: FriendshipStatus.PENDING,
        },
      });
    }

    return this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: FriendshipStatus.PENDING,
      },
    });
  }

  async acceptRequest(userId: string, requesterId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        senderId: requesterId,
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Pending friend request not found');
    }

    return this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: FriendshipStatus.ACCEPTED },
    });
  }

  async declineRequest(userId: string, requesterId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        senderId: requesterId,
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Pending friend request not found');
    }

    // Deleting is cleaner than keeping it DECLINED as it allows requesting again later.
    return this.prisma.friendship.delete({
      where: { id: friendship.id },
    });
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ConflictException('You cannot block yourself');
    }

    const existingBlock = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (existingBlock) return existingBlock;

    // Create block record
    const block = await this.prisma.block.create({
      data: { blockerId, blockedId },
    });

    // Terminate any friendships/requests
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId },
          { senderId: blockedId, receiverId: blockerId },
        ],
      },
    });

    return block;
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (!block) {
      throw new NotFoundException('Block relation not found');
    }

    return this.prisma.block.delete({
      where: { id: block.id },
    });
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true, location: true, verified: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true, location: true, verified: true },
        },
      },
    });

    return friendships.map((f) => (f.senderId === userId ? f.receiver : f.sender));
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, role: true },
        },
      },
    });

    return requests.map((r) => ({
      friendshipId: r.id,
      createdAt: r.createdAt,
      sender: r.sender,
    }));
  }

  async getOutgoingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        senderId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      friendshipId: r.id,
      createdAt: r.createdAt,
      receiver: r.receiver,
    }));
  }

  async getFriendshipStatus(userId: string, otherUserId: string) {
    if (userId === otherUserId) return { status: 'SELF' };

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });
    if (block) return { status: 'BLOCKED' };

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
    });

    if (!friendship) return { status: 'NONE' };
    if (friendship.status === FriendshipStatus.ACCEPTED) return { status: 'ACCEPTED', friendshipId: friendship.id };
    if (friendship.senderId === userId) return { status: 'PENDING_SENT', friendshipId: friendship.id };
    return { status: 'PENDING_RECEIVED', friendshipId: friendship.id };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
        },
      },
    });
    return blocks.map((b) => b.blocked);
  }

  async areFriendsAndNotBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });
    if (block) return false;

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
    });
    return !!friendship;
  }

  async areNotBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });
    return !block;
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  }
}
