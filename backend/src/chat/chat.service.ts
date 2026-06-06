import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { FriendshipsService } from '../friendships/friendships.service';

@Injectable()
export class ChatService {
  private drive;
  private readonly fallbackGifs = [
    'https://media.giphy.com/media/3o7TKzP7z1m2FrF5yM/giphy.gif',
    'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
    'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
  ];

  constructor(private readonly prisma: PrismaService, private readonly friendshipsService: FriendshipsService) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFileToDrive(file: Express.Multer.File): Promise<string> {
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    try {
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const response = await this.drive.files.create({
        requestBody: { name: file.originalname },
        media: { mimeType: file.mimetype, body: bufferStream },
        fields: 'id, webViewLink',
      });
      
      // Make it public
      await this.drive.permissions.create({
        fileId: response.data.id!,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      return `https://drive.google.com/uc?export=view&id=${response.data.id}`;
    } catch (error) {
      console.error('Google Drive Upload Error', error);
      throw new Error('Failed to upload file');
    }
  }

  async searchGiphy(query: string) {
    if (!query || query.trim().length === 0) {
      return { data: [] };
    }
    
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      console.warn('GIPHY_API_KEY not set - using fallback stickers');
      return this.getFallbackGifs(query);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&limit=24&rating=pg-13`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        console.error('GIPHY API error:', res.status, res.statusText);
        return this.getFallbackGifs(query);
      }
      const json = await res.json();
      if (!json.data?.length) {
        console.warn('GIPHY returned no results for query:', query);
        return this.getFallbackGifs(query);
      }
      return { data: json.data || [] };
    } catch (error) {
      console.error('GIPHY search error:', error instanceof Error ? error.message : String(error));
      return this.getFallbackGifs(query);
    }
  }

  private getFallbackGifs(query: string) {
    return {
      data: this.fallbackGifs.map((url, index) => ({
        id: `fallback-${index}-${query}`,
        title: query,
        images: {
          fixed_width: { url },
          original: { url },
        },
      })),
    };
  }

  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        groupId: null,
        recipientId: { not: null },
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversationsMap = new Map<string, any>();
    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.recipient : msg.sender;
      if (!otherUser) continue;

      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          id: `conv-${otherUser.id}`,
          recipientId: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          avatarUrl: otherUser.avatarUrl,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread: 0,
        });
      }
      if (msg.senderId === otherUser.id && !msg.readAt) {
        conversationsMap.get(otherUser.id).unread += 1;
      }
    }
    return Array.from(conversationsMap.values());
  }

  getGroups(userId: string) {
    return this.prisma.chatGroup.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  async getMessages(userId: string, targetId: string, isGroup: boolean) {
    if (isGroup) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: targetId, userId } },
      });
      if (!member) throw new ForbiddenException('You are not a member of this group');

      return this.prisma.message.findMany({
        where: { groupId: targetId },
        include: { sender: true },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      const canChat = await this.friendshipsService.areNotBlocked(userId, targetId);
      if (!canChat) throw new ForbiddenException('This conversation is blocked');

      // Mark messages sent by targetId to userId as read
      await this.prisma.message.updateMany({
        where: {
          senderId: targetId,
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: targetId },
            { senderId: targetId, recipientId: userId },
          ],
        },
        include: { sender: true, recipient: true },
        orderBy: { createdAt: 'asc' },
      });
    }
  }

  async sendDirectMessage(userId: string, recipientId: string, content: string, fileUrl?: string, fileType?: string) {
    const canChat = await this.friendshipsService.areNotBlocked(userId, recipientId);
    if (!canChat) throw new ForbiddenException('This conversation is blocked');

    return this.prisma.message.create({
      data: {
        senderId: userId,
        recipientId,
        content,
        fileUrl,
        fileType,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async deleteConversation(userId: string, conversationUserId: string) {
    // Mark all messages in this conversation as deleted for the current user
    await this.prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId, recipientId: conversationUserId },
          { senderId: conversationUserId, recipientId: userId },
        ],
      },
    });
    return { success: true };
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('You can only delete your own messages');
    
    await this.prisma.message.delete({ where: { id: messageId } });
    return { success: true };
  }
}
