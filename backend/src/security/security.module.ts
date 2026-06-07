import { Module, Global } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { ValidationService } from './validation.service';
import { AuthorizationService } from './authorization.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  providers: [
    RateLimitService,
    ValidationService,
    AuthorizationService,
    PrismaService,
  ],
  exports: [
    RateLimitService,
    ValidationService,
    AuthorizationService,
  ],
})
export class SecurityModule {}
