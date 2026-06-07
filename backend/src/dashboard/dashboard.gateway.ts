import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, Inject } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { User } from '@prisma/client';

@WebSocketGateway({
  namespace: '/dashboard',
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
@UseGuards(WsJwtGuard)
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    try {
      const user = (client.data?.user as User) || (client.handshake?.auth?.user as User);
      if (!user) {
        client.disconnect();
        return;
      }

      // Store socket ID for this user
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      const userSocketsSet = this.userSockets.get(user.id);
      if (userSocketsSet) {
        userSocketsSet.add(client.id);
      }

      // Join user to role-based room
      const room = `dashboard-${user.role}`;
      client.join(room);

      // Also join personal room for user-specific updates
      client.join(`dashboard-user-${user.id}`);

      this.logger.log(
        `User ${user.email} connected to dashboard namespace (${client.id})`
      );

      // Emit connection success
      client.emit('connected', {
        userId: user.id,
        room,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Connection error: ${errorMessage}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`User disconnected from dashboard namespace (${client.id})`);

      // Clean up socket tracking
      for (const [userId, sockets] of this.userSockets.entries()) {
        if (sockets.has(client.id)) {
          sockets.delete(client.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
          break;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Disconnect error: ${errorMessage}`);
    }
  }

  // Emit events for dashboard updates

  emitPropertyCreated(data: {
    id: string;
    title: string;
    description: string;
    type: string;
    price: number;
    ownerId: string;
    location: string;
    images: string[];
    createdAt: Date;
  }) {
    // Broadcast to all landlords and admins
    this.server.to('dashboard-LANDLORD').emit('propertyCreated', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to all connected users (so tenants see new properties)
    this.server.emit('propertyCreated', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitPropertyUpdated(data: {
    id: string;
    title: string;
    description: string;
    price: number;
    ownerId: string;
    status: string;
    updatedAt: Date;
  }) {
    // Broadcast to all landlords
    this.server.to('dashboard-LANDLORD').emit('propertyUpdated', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitPaymentReceived(data: {
    id: string;
    amount: number;
    landlordId: string;
    tenantId: string;
    propertyId: string;
    status: string;
    createdAt: Date;
  }) {
    // Send to specific landlord
    this.server.to(`dashboard-user-${data.landlordId}`).emit('paymentReceived', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Also notify in landlord room for dashboard stats
    this.server.to('dashboard-LANDLORD').emit('paymentReceived', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitBookingStatusChanged(data: {
    id: string;
    status: string;
    tenantId: string;
    landlordId: string;
    propertyId: string;
    updatedAt: Date;
  }) {
    // Send to tenant
    this.server.to(`dashboard-user-${data.tenantId}`).emit('bookingStatusChanged', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Send to landlord
    this.server.to(`dashboard-user-${data.landlordId}`).emit('bookingStatusChanged', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all for dashboard updates
    this.server.to('dashboard-LANDLORD').emit('bookingStatusChanged', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.server.to('dashboard-TENANT').emit('bookingStatusChanged', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitMaintenanceUpdated(data: {
    id: string;
    status: string;
    landlordId: string;
    propertyId: string;
    updatedAt: Date;
  }) {
    // Send to landlord
    this.server.to(`dashboard-user-${data.landlordId}`).emit('maintenanceUpdated', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to landlord room
    this.server.to('dashboard-LANDLORD').emit('maintenanceUpdated', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitStatisticsUpdated(data: {
    userId: string;
    role: string;
    stats: {
      totalProperties?: number;
      totalBookings?: number;
      totalRevenue?: number;
      activeListings?: number;
      pendingBookings?: number;
      [key: string]: any;
    };
    timestamp: Date;
  }) {
    // Send to specific user
    this.server.to(`dashboard-user-${data.userId}`).emit('statisticsUpdated', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('requestUpdate')
  handleUpdateRequest(client: Socket, data: any) {
    this.logger.log(`Update request from ${client.id}: ${JSON.stringify(data)}`);
    // Acknowledge receipt
    client.emit('updateRequested', {
      type: data.type,
      timestamp: new Date().toISOString(),
    });
  }
}
