import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import { CallStateService } from './call-state.service';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { PresenceService } from '../socket/presence.service';
import { RateLimitService } from '../security/rate-limit.service';
import { RATE_LIMIT_CONFIGS } from '../security/security.constants';

@WebSocketGateway({
  cors: { origin: process.env.SOCKET_IO_CORS_ORIGIN || '*', credentials: true },
  namespace: '/calls',
})
@Injectable()
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private callStateService: CallStateService,
    private prisma: PrismaService,
    private presenceService: PresenceService,
    private rateLimitService: RateLimitService,
  ) {}

  handleConnection(socket: Socket) {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;
    if (!userId) return;

    // End any active calls
    const call = this.callStateService.getUserCall(userId);
    if (call && call.status !== 'ended') {
      this.callStateService.endCall(call.callId);

      const otherUserId = call.initiatorId === userId ? call.recipientId : call.initiatorId;
      this.server.to(otherUserId).emit('callEnded', {
        callId: call.callId,
        reason: 'disconnected',
      });
    }
  }

  @SubscribeMessage('initiateCall')
  async handleInitiateCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { recipientId: string; callType: 'audio' | 'video' }
  ) {
    const initiatorId = socket.data.userId;

    // Rate limiting: 5 calls per second per user
    if (!this.rateLimitService.isAllowed(initiatorId, RateLimitService.createConfig(RATE_LIMIT_CONFIGS.CALL.maxTokens, RATE_LIMIT_CONFIGS.CALL.refillRate))) {
      socket.emit('error', { message: 'Too many call attempts. Please slow down.' });
      return;
    }

    // Check if initiator is already in a call
    if (this.callStateService.isUserInCall(initiatorId)) {
      socket.emit('error', { message: 'You are already in a call' });
      return;
    }

    // Check if recipient is already in a call
    if (this.callStateService.isUserInCall(data.recipientId)) {
      socket.emit('error', { message: 'Recipient is busy' });
      return;
    }

    // Check if recipient exists and is online
    const recipient = await this.prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    if (!recipient) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const isRecipientOnline = this.presenceService.isUserOnline(data.recipientId);
    if (!isRecipientOnline) {
      socket.emit('error', { message: 'User is offline' });
      return;
    }

    // Create call
    const callId = uuidv4();
    const call = this.callStateService.createCall(
      callId,
      initiatorId,
      data.recipientId,
      socket.id,
      data.callType
    );

    // Get initiator info
    const initiator = await this.prisma.user.findUnique({
      where: { id: initiatorId },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    // Notify initiator
    socket.emit('callInitiated', { callId, call });

    // Notify recipient
    this.server.to(data.recipientId).emit('incomingCall', {
      callId,
      initiatorId,
      initiator: {
        id: initiator?.id,
        firstName: initiator?.firstName,
        lastName: initiator?.lastName,
        avatarUrl: initiator?.avatarUrl,
      },
      callType: data.callType,
    });
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string }
  ) {
    const recipientId = socket.data.userId;
    const call = this.callStateService.getCall(data.callId);

    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    if (call.recipientId !== recipientId) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Update call status
    this.callStateService.updateCallStatus(data.callId, 'answered', socket.id);

    // Notify both parties
    socket.emit('callAnswered', { callId: data.callId });
    this.server.to(call.initiatorId).emit('callAnswered', {
      callId: data.callId,
      recipientSocketId: socket.id,
    });
  }

  @SubscribeMessage('rejectCall')
  handleRejectCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string }
  ) {
    const userId = socket.data.userId;
    const call = this.callStateService.getCall(data.callId);

    if (!call) return;

    if (call.recipientId !== userId) return;

    this.callStateService.endCall(data.callId);

    socket.emit('callRejected', { callId: data.callId });
    this.server.to(call.initiatorId).emit('callRejected', {
      callId: data.callId,
      reason: 'rejected',
    });

    this.callStateService.removeCall(data.callId);
  }

  @SubscribeMessage('endCall')
  handleEndCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string }
  ) {
    const userId = socket.data.userId;
    const call = this.callStateService.getCall(data.callId);

    if (!call) return;

    if (call.initiatorId !== userId && call.recipientId !== userId) return;

    this.callStateService.endCall(data.callId);

    const otherUserId = call.initiatorId === userId ? call.recipientId : call.initiatorId;

    socket.emit('callEnded', { callId: data.callId, duration: call.duration });
    this.server.to(otherUserId).emit('callEnded', {
      callId: data.callId,
      duration: call.duration,
      reason: 'ended',
    });

    // Clean up after a short delay
    setTimeout(() => {
      this.callStateService.removeCall(data.callId);
    }, 1000);
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string; candidate: any }
  ) {
    const userId = socket.data.userId;
    
    // Rate limiting: 5 events per second per user (ICE candidates can be many)
    if (!this.rateLimitService.isAllowed(userId, RateLimitService.createConfig(RATE_LIMIT_CONFIGS.CALL.maxTokens, RATE_LIMIT_CONFIGS.CALL.refillRate))) {
      return; // silently ignore rate-limited ICE candidates
    }
    
    const call = this.callStateService.getCall(data.callId);
    if (!call) return;

    const otherUserId = call.initiatorId === userId ? call.recipientId : call.initiatorId;
    this.server.to(otherUserId).emit('iceCandidate', {
      callId: data.callId,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string; offer: any }
  ) {
    const call = this.callStateService.getCall(data.callId);
    if (!call) return;

    const otherUserId = call.initiatorId === socket.data.userId ? call.recipientId : call.initiatorId;
    this.server.to(otherUserId).emit('offer', {
      callId: data.callId,
      offer: data.offer,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string; answer: any }
  ) {
    const call = this.callStateService.getCall(data.callId);
    if (!call) return;

    const otherUserId = call.initiatorId === socket.data.userId ? call.recipientId : call.initiatorId;
    this.server.to(otherUserId).emit('answer', {
      callId: data.callId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('toggleMute')
  handleToggleMute(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string; muted: boolean }
  ) {
    const call = this.callStateService.getCall(data.callId);
    if (!call) return;

    const otherUserId = call.initiatorId === socket.data.userId ? call.recipientId : call.initiatorId;
    this.server.to(otherUserId).emit('userMuted', {
      callId: data.callId,
      userId: socket.data.userId,
      muted: data.muted,
    });
  }

  @SubscribeMessage('toggleVideo')
  handleToggleVideo(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { callId: string; videoEnabled: boolean }
  ) {
    const call = this.callStateService.getCall(data.callId);
    if (!call) return;

    const otherUserId = call.initiatorId === socket.data.userId ? call.recipientId : call.initiatorId;
    this.server.to(otherUserId).emit('userVideoToggled', {
      callId: data.callId,
      userId: socket.data.userId,
      videoEnabled: data.videoEnabled,
    });
  }
}
