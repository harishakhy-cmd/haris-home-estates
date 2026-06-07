import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
}

/**
 * Firebase Cloud Messaging Service
 * Handles push notifications across web, iOS, and Android
 */
@Injectable()
export class FcmService {
  constructor(private readonly prisma: PrismaService) {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } catch (error: any) {
        console.warn('Firebase initialization skipped (development mode):', error?.message || 'Unknown error');
      }
    }
  }

  /**
   * Register or update FCM token for a user
   */
  async registerToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fcmTokens: {
          push: token,
        },
      },
    });
  }

  /**
   * Remove FCM token (on logout or uninstall)
   */
  async removeToken(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    });

    if (user) {
      const updatedTokens = user.fcmTokens.filter((t) => t !== token);
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmTokens: updatedTokens },
      });
    }
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true, notificationsEnabled: true },
    });

    if (!user || !user.notificationsEnabled || user.fcmTokens.length === 0) {
      return;
    }

    await this.sendToTokens(user.fcmTokens, payload);
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, notificationsEnabled: true },
      select: { fcmTokens: true },
    });

    const allTokens = users
      .flatMap((user) => user.fcmTokens)
      .filter((token) => token);

    if (allTokens.length > 0) {
      await this.sendToTokens(allTokens, payload);
    }
  }

  /**
   * Send notification to specific FCM tokens
   */
  private async sendToTokens(tokens: string[], payload: NotificationPayload): Promise<void> {
    if (!admin.messaging()) {
      console.warn('Firebase Messaging not available');
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/logo.png',
      },
      data: payload.data || {},
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/logo.png',
          badge: payload.badge || '/badge.png',
          tag: payload.tag,
          vibrate: [100, 50, 100],
          actions: [
            {
              action: 'open',
              title: 'Open',
            },
          ],
        },
        fcmOptions: {
          link: '/messages',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      android: {
        priority: 'high' as any,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: 'ic_notification',
          color: '#FF6B00',
          priority: 'high',
          channelId: 'default',
        },
      },
    };

    try {
      // Send to all tokens (Firebase handles duplicates)
      for (const token of tokens) {
        try {
          await admin.messaging().send(message as any);
        } catch (error: any) {
          // Handle invalid tokens
          if (error?.code === 'messaging/invalid-registration-token' ||
              error?.code === 'messaging/mismatched-credential' ||
              error?.code === 'messaging/message-rate-exceeded') {
            await this.removeToken(error.uid, token);
          }
        }
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error);
    }
  }

  /**
   * Notification for new message received
   */
  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    messagePreview: string,
  ): Promise<void> {
    await this.sendToUser(recipientId, {
      title: `New message from ${senderName}`,
      body: messagePreview,
      tag: 'message',
      data: {
        type: 'message',
        action: 'openChat',
      },
    });
  }

  /**
   * Notification for incoming call
   */
  async notifyIncomingCall(
    recipientId: string,
    callerName: string,
    callType: 'audio' | 'video',
  ): Promise<void> {
    await this.sendToUser(recipientId, {
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling...`,
      tag: 'call',
      data: {
        type: 'call',
        action: 'answerCall',
        callType,
      },
    });
  }

  /**
   * Notification for new property assignment
   */
  async notifyPropertyAssigned(
    landlordId: string,
    tenantName: string,
    propertyTitle: string,
  ): Promise<void> {
    await this.sendToUser(landlordId, {
      title: 'New Property Assignment',
      body: `${tenantName} is interested in ${propertyTitle}`,
      tag: 'property',
      data: {
        type: 'property',
        action: 'viewProperty',
      },
    });
  }

  /**
   * Notification for payment update
   */
  async notifyPaymentUpdate(
    userId: string,
    amount: string,
    status: string,
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Payment Update',
      body: `Payment of ${amount} has been ${status}`,
      tag: 'payment',
      data: {
        type: 'payment',
        action: 'viewPayment',
        status,
      },
    });
  }

  /**
   * Notification for maintenance request
   */
  async notifyMaintenanceRequest(
    recipientId: string,
    requesterName: string,
    issueDescription: string,
  ): Promise<void> {
    await this.sendToUser(recipientId, {
      title: 'Maintenance Request',
      body: `${requesterName} requested: ${issueDescription}`,
      tag: 'maintenance',
      data: {
        type: 'maintenance',
        action: 'viewRequest',
      },
    });
  }

  /**
   * Notification for booking status change
   */
  async notifyBookingStatusChange(
    recipientId: string,
    status: string,
    propertyTitle: string,
  ): Promise<void> {
    await this.sendToUser(recipientId, {
      title: 'Booking Update',
      body: `Your booking for ${propertyTitle} has been ${status}`,
      tag: 'booking',
      data: {
        type: 'booking',
        action: 'viewBooking',
        status,
      },
    });
  }

  /**
   * Batch send topic-based notification
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<void> {
    if (!admin.messaging()) {
      console.warn('Firebase Messaging not available');
      return;
    }

    try {
      await admin.messaging().send({
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });
    } catch (error) {
      console.error('Error sending topic notification:', error);
    }
  }

  /**
   * Subscribe user to topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!admin.messaging() || tokens.length === 0) {
      return;
    }

    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  /**
   * Unsubscribe user from topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!admin.messaging() || tokens.length === 0) {
      return;
    }

    try {
      await admin.messaging().unsubscribeFromTopic(tokens, topic);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }
}
