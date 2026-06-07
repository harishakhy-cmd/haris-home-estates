import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FcmService } from './fcm.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [FcmService],
  exports: [FcmService],
})
export class NotificationsModule {}
