import { Module } from '@nestjs/common';
import { DashboardGateway } from './dashboard.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // 🔥 gives access to JwtService
  ],
  providers: [DashboardGateway],
  exports: [DashboardGateway],
})
export class DashboardModule {}