import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    FavoritesModule,
    BookingsModule,
    InquiriesModule,
    InvoicesModule,
    MessagesModule,
    ReviewsModule,
    AdminModule,
    PaymentsModule,
    ChatModule,
    FriendshipsModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
