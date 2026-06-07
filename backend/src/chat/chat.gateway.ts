import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, Inject, BadRequestException } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { PresenceService } from '../socket/presence.service';
import { MessageDeliveryService } from '../socket/message-delivery.service';
import { FcmService } from '../notifications/fcm.service';
import { RateLimitService } from '../security/rate-limit.service';
import { ValidationService } from '../security/validation.service';
import { AuthorizationService } from '../security/authorization.service';
import { RATE_LIMIT_CONFIGS } from '../security/security.constants';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly friendshipsService: FriendshipsService,
    private readonly presenceService: PresenceService,
    private readonly messageDeliveryService: MessageDeliveryService,
    private readonly rateLimitService: RateLimitService,
    private readonly validationService: ValidationService,
    private readonly authorizationService: AuthorizationService,
    @Inject('FCM_SERVICE') private readonly fcmService?: FcmService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user?.sub) {
      this.logger.debug(`User ${user.sub} disconnected from ${client.id}`);
      try {
        await this.presenceService.markUserOffline(user.sub, client.id);
        this.server.emit('userOffline', { userId: user.sub, timestamp: new Date() });
      } catch (error: any) {
        this.logger.error(`Error marking user offline: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('authenticate')
  async handleAuthenticate(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.sub) {
      this.logger.warn('Authentication failed: no user sub');
      return { error: 'Unauthorized' };
    }

    try {
      await this.presenceService.markUserOnline(user.sub, client.id);

      // Join user-specific room
      client.join(`user_${user.sub}`);

      // Join all groups the user is a member of
      const memberships = await this.prisma.groupMember.findMany({
        where: { userId: user.sub },
        select: { groupId: true },
      });
      memberships.forEach((m) => client.join(`group_${m.groupId}`));

      client.emit('authenticated', { success: true, userId: user.sub });
      this.logger.debug(`User ${user.sub} authenticated successfully`);
      return { success: true, userId: user.sub };
    } catch (error: any) {
      this.logger.error(`Authentication error: ${error?.message || 'Unknown error'}`);
      return { error: error?.message || 'Authentication failed' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId?: string; groupId?: string; content: string; fileUrl?: string; fileType?: string; callId?: string; clientTempId?: string; viewOnce?: boolean },
  ) {
    const user = client.data.user;

    // Rate limiting: 10 messages per second per user
    if (!this.rateLimitService.isAllowed(user.sub, RateLimitService.createConfig(RATE_LIMIT_CONFIGS.MESSAGE.maxTokens, RATE_LIMIT_CONFIGS.MESSAGE.refillRate))) {
      return { error: 'Too many messages. Please slow down.' };
    }

    // Validate message content
    try {
      const sanitizedContent = this.validationService.sanitizeMessage(payload.content, 5000);
      payload.content = sanitizedContent;
    } catch (error) {
      return { error: (error as any).message || 'Invalid message content' };
    }

    // Verify recipient or group
    if (payload.groupId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: payload.groupId, userId: user.sub } },
      });
      if (!member) return { error: 'Not a member of this group' };
    } else if (payload.recipientId) {
      const canChat = await this.friendshipsService.areNotBlocked(user.sub, payload.recipientId);
      if (!canChat) {
        return { error: 'This conversation is blocked' };
      }
    }

    const message = await this.prisma.message.create({
      data: {
        senderId: user.sub,
        recipientId: payload.recipientId,
        groupId: payload.groupId,
        content: payload.content,
        fileUrl: payload.fileUrl,
        fileType: payload.fileType,
        callId: payload.callId,
        viewOnce: payload.viewOnce ?? false,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    const realtimeMessage = { ...message, clientTempId: payload.clientTempId };

    if (payload.groupId) {
      this.server.to(`group_${payload.groupId}`).emit('newMessage', realtimeMessage);
    } else if (payload.recipientId) {
      this.server.to(`user_${payload.recipientId}`).emit('newMessage', realtimeMessage);
      client.emit('newMessage', realtimeMessage); // send back to sender
    }
    return { success: true, messageId: message.id };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('reactMessage')
  async handleReactMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string; emoji: string }) {
    const userId = client.data.user.sub;
    // append reaction
    const msg = await this.prisma.message.findUnique({ where: { id: payload.messageId } });
    if (!msg) return { error: 'Message not found' };
    const existing = msg.reactions ?? [];
    const next = Array.isArray(existing) ? [...existing, { userId, emoji: payload.emoji }] : [{ userId, emoji: payload.emoji }];
    await this.prisma.message.update({ where: { id: payload.messageId }, data: { reactions: next } });
    this.server.emit('messageReacted', { messageId: payload.messageId, reactions: next });
    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string }) {
    const userId = client.data.user.sub;
    
    try {
      await this.authorizationService.requirePermission(userId, 'DELETE_MESSAGE', payload.messageId);
    } catch (error) {
      return { error: (error as any).message || 'Not allowed to delete this message' };
    }
    
    const msg = await this.prisma.message.findUnique({ where: { id: payload.messageId } });
    if (!msg) return { error: 'Message not found' };
    
    await this.prisma.message.update({ where: { id: payload.messageId }, data: { deletedAt: new Date() } });
    
    // notify involved parties
    if (msg.groupId) this.server.to(`group_${msg.groupId}`).emit('messageDeleted', { messageId: payload.messageId });
    else if (msg.recipientId) {
      this.server.to(`user_${msg.recipientId}`).emit('messageDeleted', { messageId: payload.messageId });
      client.emit('messageDeleted', { messageId: payload.messageId });
    }
    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('editMessage')
  async handleEditMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string; content: string }) {
    const userId = client.data.user.sub;
    
    // Validate message content
    try {
      const sanitizedContent = this.validationService.sanitizeMessage(payload.content, 5000);
      payload.content = sanitizedContent;
    } catch (error) {
      return { error: (error as any).message || 'Invalid message content' };
    }
    
    try {
      await this.authorizationService.requirePermission(userId, 'DELETE_MESSAGE', payload.messageId);
    } catch (error) {
      return { error: (error as any).message || 'Not allowed to edit this message' };
    }
    
    const msg = await this.prisma.message.findUnique({ where: { id: payload.messageId } });
    if (!msg) return { error: 'Message not found' };
    
    const created = msg.createdAt;
    const tenSeconds = 10000;
    if (new Date().getTime() - created.getTime() > tenSeconds) return { error: 'Edit window expired' };
    
    const edited = await this.prisma.message.update({ 
      where: { id: payload.messageId }, 
      data: { content: payload.content, editedAt: new Date(), editedContent: payload.content } 
    });
    
    // broadcast edit
    if (edited.groupId) this.server.to(`group_${edited.groupId}`).emit('messageEdited', edited);
    else if (edited.recipientId) {
      this.server.to(`user_${edited.recipientId}`).emit('messageEdited', edited);
      client.emit('messageEdited', edited);
    }
    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId?: string; groupId?: string; isTyping: boolean },
  ) {
    const senderId = client.data.user.sub;
    
    // Rate limiting: 20 typing events per second per user
    if (!this.rateLimitService.isAllowed(senderId, RateLimitService.createConfig(RATE_LIMIT_CONFIGS.TYPING.maxTokens, RATE_LIMIT_CONFIGS.TYPING.refillRate))) {
      return; // silently ignore rate-limited typing events
    }
    
    if (payload.groupId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: payload.groupId, userId: senderId } },
      });
      if (!member) return;
      client.to(`group_${payload.groupId}`).emit('typing', { senderId, groupId: payload.groupId, isTyping: payload.isTyping });
      return;
    }

    if (!payload.recipientId) return;
    const canChat = await this.friendshipsService.areNotBlocked(senderId, payload.recipientId);
    if (!canChat) return;
    this.server.to(`user_${payload.recipientId}`).emit('typing', { senderId, recipientId: payload.recipientId, isTyping: payload.isTyping });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId?: string; groupId?: string },
  ) {
    const userId = client.data.user.sub;
    if (payload.senderId) {
      const now = new Date();
      await this.prisma.message.updateMany({
        where: { senderId: payload.senderId, recipientId: userId, readAt: null },
        data: { readAt: now },
      });
      // find view-once messages and mark deleted after read
      const viewOnceMsgs = await this.prisma.message.findMany({ where: { senderId: payload.senderId, recipientId: userId, viewOnce: true, selfDestructed: false }, select: { id: true } });
      if (viewOnceMsgs.length) {
        await this.prisma.message.updateMany({ where: { id: { in: viewOnceMsgs.map(m => m.id) } }, data: { selfDestructed: true, deletedAt: now } });
        viewOnceMsgs.forEach(m => this.server.to(`user_${payload.senderId}`).emit('messageDeleted', { messageId: m.id }));
      }
      this.server.to(`user_${payload.senderId}`).emit('messagesRead', { readerId: userId });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { name: string; memberIds: string[] },
  ) {
    const user = client.data.user;
    const group = await this.prisma.chatGroup.create({
      data: {
        name: payload.name,
        isGroup: true,
        members: {
          create: [
            { userId: user.sub, role: 'ADMIN' },
            ...payload.memberIds.map((id) => ({ userId: id, role: 'MEMBER' })),
          ],
        },
      },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });

    client.join(`group_${group.id}`);
    payload.memberIds.forEach((id) => {
      this.server.to(`user_${id}`).emit('groupCreated', group);
      const activeUserSockets = this.presenceService.getUserSockets(id);
      if (activeUserSockets) {
        activeUserSockets.forEach((socketId: string) => {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) socket.join(`group_${group.id}`);
        });
      }
    });

    return group;
  }

  // WebRTC Signaling
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('webrtcOffer')
  async handleWebRtcOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string; sdp?: any; offer?: any; isVideo?: boolean; callType?: string }) {
    const callerId = client.data.user.sub;
    const canCall = await this.friendshipsService.areFriendsAndNotBlocked(callerId, payload.targetId);
    if (!canCall) return;

    this.server.to(`user_${payload.targetId}`).emit('webrtcOffer', {
      callerId,
      senderId: callerId,
      sdp: payload.sdp ?? payload.offer,
      offer: payload.offer ?? payload.sdp,
      isVideo: payload.isVideo ?? payload.callType === 'video',
      callType: payload.callType ?? (payload.isVideo ? 'video' : 'audio'),
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('webrtcAnswer')
  async handleWebRtcAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string; sdp?: any; answer?: any }) {
    const responderId = client.data.user.sub;
    const canCall = await this.friendshipsService.areFriendsAndNotBlocked(responderId, payload.targetId);
    if (!canCall) return;

    this.server.to(`user_${payload.targetId}`).emit('webrtcAnswer', {
      responderId,
      sdp: payload.sdp ?? payload.answer,
      answer: payload.answer ?? payload.sdp,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('webrtcIceCandidate')
  async handleWebRtcIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string; candidate: any }) {
    const senderId = client.data.user.sub;
    const canCall = await this.friendshipsService.areFriendsAndNotBlocked(senderId, payload.targetId);
    if (!canCall) return;

    this.server.to(`user_${payload.targetId}`).emit('webrtcIceCandidate', {
      senderId,
      candidate: payload.candidate,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('webrtcCallEnded')
  handleCallEnded(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string }) {
    this.server.to(`user_${payload.targetId}`).emit('webrtcCallEnded', {
      callerId: client.data.user.sub,
    });
  }

  // Notification broadcast called from external services
  broadcastPropertyUpload(property: any) {
    this.server.emit('newProperty', {
      message: `A new property '${property.title}' has been listed!`,
      propertyId: property.id,
      city: property.city,
      price: property.price,
    });
  }
}
