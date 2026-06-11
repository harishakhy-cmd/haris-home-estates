import { Module, Global } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { ValidationService } from './validation.service';
import { AuthorizationService } from './authorization.service';

@Global()
@Module({
  providers: [
    RateLimitService,
    ValidationService,
    AuthorizationService,
  ],
  exports: [
    RateLimitService,
    ValidationService,
    AuthorizationService,
  ],
})
export class SecurityModule {}
