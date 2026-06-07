import { Module } from '@nestjs/common';
import { CallsGateway } from './calls.gateway';
import { CallStateService } from './call-state.service';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../socket/presence.service';

@Module({
  providers: [CallsGateway, CallStateService, PrismaService, PresenceService],
  exports: [CallStateService],
})
export class CallsModule {}
