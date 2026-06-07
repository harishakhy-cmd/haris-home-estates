import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

/**
 * Authorization service for permission checks
 */
@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user can send message to recipient
   */
  async canSendMessage(senderId: string, recipientId: string): Promise<boolean> {
    // Users can always send messages to each other
    // In future, could add friend lists, blocked users, etc.
    return senderId !== recipientId;
  }

  /**
   * Check if user can view conversation
   */
  async canViewConversation(userId: string, participantId: string): Promise<boolean> {
    // Users can view conversations they're part of
    return userId !== participantId;
  }

  /**
   * Check if user can update property
   */
  async canUpdateProperty(userId: string, propertyId: string): Promise<boolean> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { landlordId: true },
    });

    if (!property) {
      return false;
    }

    return property.landlordId === userId;
  }

  /**
   * Check if user can view property
   */
  async canViewProperty(userId: string, propertyId: string, userRole: UserRole): Promise<boolean> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { landlordId: true, status: true },
    });

    if (!property) {
      return false;
    }

    // Landlords can view their own properties
    if (userRole === 'LANDLORD' && property.landlordId === userId) {
      return true;
    }

    // Admins can view all properties
    if (userRole === 'ADMIN') {
      return true;
    }

    // Tenants can view active properties
    if (userRole === 'TENANT' && property.status === 'ACTIVE') {
      return true;
    }

    return false;
  }

  /**
   * Check if user can accept/reject booking
   */
  async canManageBooking(userId: string, bookingId: string): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        property: {
          select: { landlordId: true },
        },
      },
    });

    if (!booking) {
      return false;
    }

    // Only landlord can manage their property's bookings
    return booking.property.landlordId === userId;
  }

  /**
   * Check if user can view booking
   */
  async canViewBooking(userId: string, bookingId: string, userRole: UserRole): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        tenantId: true,
        property: {
          select: { landlordId: true },
        },
      },
    });

    if (!booking) {
      return false;
    }

    // Tenant can view their bookings
    if (booking.tenantId === userId) {
      return true;
    }

    // Landlord can view bookings for their properties
    if (booking.property.landlordId === userId) {
      return true;
    }

    // Admin can view all bookings
    if (userRole === 'ADMIN') {
      return true;
    }

    return false;
  }

  /**
   * Check if user can view payment
   */
  async canViewPayment(userId: string, paymentId: string, userRole: UserRole): Promise<boolean> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        userId: true,
        propertyId: true,
      },
    });

    if (!payment) {
      return false;
    }

    // User who made the payment can view it
    if (payment.userId === userId) {
      return true;
    }

    // Landlord can view payments for their properties
    if (payment.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: payment.propertyId },
        select: { landlordId: true },
      });
      if (property?.landlordId === userId) {
        return true;
      }
    }

    // Admin can view all payments
    if (userRole === 'ADMIN') {
      return true;
    }

    return false;
  }

  /**
   * Check if user can call another user
   */
  async canCallUser(callerId: string, recipientId: string): Promise<boolean> {
    // Users can call each other (could add blocked users check)
    return callerId !== recipientId;
  }

  /**
   * Check if user can delete message
   */
  async canDeleteMessage(userId: string, messageId: string): Promise<boolean> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });

    if (!message) {
      return false;
    }

    // Users can only delete their own messages
    return message.senderId === userId;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(user: User): boolean {
    return user.role === 'ADMIN';
  }

  /**
   * Check if user has landlord role
   */
  isLandlord(user: User): boolean {
    return user.role === 'LANDLORD';
  }

  /**
   * Check if user has tenant role
   */
  isTenant(user: User): boolean {
    return user.role === 'TENANT';
  }

  /**
   * Verify authorization or throw exception
   */
  async requirePermission(
    userId: string,
    permission: string,
    resourceId?: string,
    userRole?: UserRole
  ): Promise<void> {
    let hasPermission = false;

    switch (permission) {
      case 'UPDATE_PROPERTY':
        hasPermission = await this.canUpdateProperty(userId, resourceId!);
        break;
      case 'VIEW_PROPERTY':
        hasPermission = await this.canViewProperty(userId, resourceId!, userRole!);
        break;
      case 'MANAGE_BOOKING':
        hasPermission = await this.canManageBooking(userId, resourceId!);
        break;
      case 'VIEW_BOOKING':
        hasPermission = await this.canViewBooking(userId, resourceId!, userRole!);
        break;
      case 'VIEW_PAYMENT':
        hasPermission = await this.canViewPayment(userId, resourceId!, userRole!);
        break;
      case 'DELETE_MESSAGE':
        hasPermission = await this.canDeleteMessage(userId, resourceId!);
        break;
      default:
        throw new ForbiddenException('Unknown permission');
    }

    if (!hasPermission) {
      throw new ForbiddenException(`Permission denied: ${permission}`);
    }
  }
}
