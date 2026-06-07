import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PresenceService } from '../socket/presence.service';
import { MessageDeliveryService } from '../socket/message-delivery.service';
import { FcmService } from '../notifications/fcm.service';

@Module({
  imports: [PrismaModule, AuthModule, FriendshipsModule, NotificationsModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    PresenceService,
    MessageDeliveryService,
    {
      provide: 'FCM_SERVICE',
      useClass: FcmService,
    },
  ],
  exports: [ChatGateway, PresenceService, MessageDeliveryService],
})
export class ChatModule {}
