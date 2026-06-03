import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class ChatService {
  private drive;

  constructor(private readonly prisma: PrismaService) {
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
    if (!process.env.GOOGLE_CLIENT_EMAIL) return 'https://placehold.co/600x400.png?text=Mock+File';
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

      return response.data.webViewLink!;
    } catch (error) {
      console.error('Google Drive Upload Error', error);
      throw new Error('Failed to upload file');
    }
  }

  getConversations(userId: string) {
    return this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      include: { sender: true, recipient: true, group: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  getGroups(userId: string) {
    return this.prisma.chatGroup.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  getMessages(userId: string, targetId: string, isGroup: boolean) {
    if (isGroup) {
      return this.prisma.message.findMany({
        where: { groupId: targetId },
        include: { sender: true },
        orderBy: { createdAt: 'asc' },
      });
    } else {
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
}
