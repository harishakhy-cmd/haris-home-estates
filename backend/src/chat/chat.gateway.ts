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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { markUserOnline, markUserOffline } from '../users/users.service';
import { FriendshipsService } from '../friendships/friendships.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map userId to Set of socket ids for tracking online presence
  private activeUsers = new Map<string, Set<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly friendshipsService: FriendshipsService,
  ) {}

  async handleConnection(client: Socket) {
    // Connection is established. We don't authenticate yet, clients will send auth token via handshake
    // Authentication happens on specific guarded events, or we could manually verify here.
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user?.sub) {
      const sockets = this.activeUsers.get(user.sub);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.activeUsers.delete(user.sub);
          markUserOffline(user.sub);
          this.server.emit('userOffline', { userId: user.sub });
        }
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('authenticate')
  async handleAuthenticate(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.sub) return;

    if (!this.activeUsers.has(user.sub)) {
      this.activeUsers.set(user.sub, new Set());
    }
    this.activeUsers.get(user.sub)!.add(client.id);
    markUserOnline(user.sub);

    client.join(`user_${user.sub}`);

    // Join all groups the user is a member of
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId: user.sub },
      select: { groupId: true },
    });
    memberships.forEach((m) => client.join(`group_${m.groupId}`));

    client.emit('authenticated', { success: true, userId: user.sub });
    this.server.emit('userOnline', { userId: user.sub });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId?: string; groupId?: string; content: string; fileUrl?: string; fileType?: string; callId?: string },
  ) {
    const user = client.data.user;

    // Verify recipient or group
    if (payload.groupId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: payload.groupId, userId: user.sub } },
      });
      if (!member) return { error: 'Not a member of this group' };
    } else if (payload.recipientId) {
      const canChat = await this.friendshipsService.areFriendsAndNotBlocked(user.sub, payload.recipientId);
      if (!canChat) {
        return { error: 'You can only message confirmed friends who have not blocked you' };
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
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    if (payload.groupId) {
      this.server.to(`group_${payload.groupId}`).emit('newMessage', message);
    } else if (payload.recipientId) {
      this.server.to(`user_${payload.recipientId}`).emit('newMessage', message);
      client.emit('newMessage', message); // send back to sender
    }
    return { success: true, messageId: message.id };
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
      const activeUserSockets = this.activeUsers.get(id);
      if (activeUserSockets) {
        activeUserSockets.forEach(socketId => {
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
  async handleWebRtcOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string; sdp: any; isVideo: boolean }) {
    const callerId = client.data.user.sub;
    const canCall = await this.friendshipsService.areFriendsAndNotBlocked(callerId, payload.targetId);
    if (!canCall) return;

    this.server.to(`user_${payload.targetId}`).emit('webrtcOffer', {
      callerId,
      sdp: payload.sdp,
      isVideo: payload.isVideo,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('webrtcAnswer')
  async handleWebRtcAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string; sdp: any }) {
    const responderId = client.data.user.sub;
    const canCall = await this.friendshipsService.areFriendsAndNotBlocked(responderId, payload.targetId);
    if (!canCall) return;

    this.server.to(`user_${payload.targetId}`).emit('webrtcAnswer', {
      responderId,
      sdp: payload.sdp,
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
