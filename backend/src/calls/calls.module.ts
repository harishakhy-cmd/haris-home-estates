import { Module } from '@nestjs/common';
import { CallsGateway } from './calls.gateway';
import { CallStateService } from './call-state.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { PresenceService } from '../socket/presence.service';
import { MessageDeliveryService } from '../socket/message-delivery.service';

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
  ],
  providers: [
    CallsGateway,
    CallStateService,
    PresenceService,
    MessageDeliveryService,
  ],
  exports: [
    CallStateService,
  ],
})
export class CallsModule {}