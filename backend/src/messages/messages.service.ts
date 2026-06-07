import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';

/**
 * Validates audio file
 */
function validateAudioFile(file: Express.Multer.File): void {
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    throw new BadRequestException('Audio file must be less than 10 MB');
  }

  const validMimeTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'];
  if (!validMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException('Invalid audio file type. Must be WebM, MP3, WAV, or M4A');
  }
}

/**
 * Validates media file (images, videos, documents)
 */
function validateMediaFile(file: Express.Multer.File): string {
  const maxSize = 50 * 1024 * 1024; // 50 MB
  if (file.size > maxSize) {
    throw new BadRequestException('File must be less than 50 MB');
  }

  const mimeType = file.mimetype.toLowerCase();

  if (mimeType.startsWith('image/')) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid image type. Must be JPEG, PNG, GIF, or WebP');
    }
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validVideoTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid video type. Must be MP4, WebM, or MOV');
    }
    return 'video';
  } else if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('sheet')
  ) {
    return 'document';
  }

  throw new BadRequestException('Unsupported file type');
}

/**
 * Upload file to Cloudinary-like storage
 * For now, returns a data URL (in production, upload to Cloudinary)
 */
async function uploadFile(file: Express.Multer.File): Promise<string> {
  // In production, upload to Cloudinary or similar
  // For now, return a placeholder URL with base64 encoding for small files
  if (file.size < 1024 * 100) { // < 100 KB, use data URL for testing
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }

  // For larger files, return a placeholder
  // TODO: Implement actual file upload to Cloudinary
  return `file://${file.originalname}`;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(senderId: string, dto: CreateMessageDto) {
    return this.prisma.message.create({ data: { ...dto, senderId } });
  }

  async createVoiceMessage(
    senderId: string,
    file: Express.Multer.File,
    recipientId?: string,
    groupId?: string,
    duration?: number,
  ) {
    validateAudioFile(file);

    // Upload file
    const voiceUrl = await uploadFile(file);

    // Create message with voice metadata
    return this.prisma.message.create({
      data: {
        senderId,
        recipientId,
        groupId,
        content: '[Voice Message]',
        voiceUrl,
        voiceDuration: duration || 0,
        voiceSize: file.size,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async createMediaMessage(
    senderId: string,
    file: Express.Multer.File,
    recipientId?: string,
    groupId?: string,
    mediaType?: string,
  ) {
    const detectedType = mediaType || validateMediaFile(file);

    // Upload file
    const fileUrl = await uploadFile(file);

    // Create message with media metadata
    return this.prisma.message.create({
      data: {
        senderId,
        recipientId,
        groupId,
        content: `[${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Message]`,
        fileUrl,
        fileType: detectedType,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
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
