import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async registerFcmToken(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    const userId = req.user.sub;
    await this.fcmService.registerToken(userId, body.token);
    return { success: true, message: 'FCM token registered' };
  }

  @Post('fcm-token/remove')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeFcmToken(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    const userId = req.user.sub;
    await this.fcmService.removeToken(userId, body.token);
    return { success: true, message: 'FCM token removed' };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async testNotification(
    @Request() req: any,
    @Body() body: { title: string; body: string },
  ) {
    const userId = req.user.sub;
    await this.fcmService.sendToUser(userId, {
      title: body.title,
      body: body.body,
    });
    return { success: true, message: 'Test notification sent' };
  }
}
