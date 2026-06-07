import { Body, Controller, Get, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

interface UploadedFileRequest {
  file: Express.Multer.File;
}

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.messages.create(user.id, dto);
  }

  @Post('voice')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadVoice(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { recipientId?: string; groupId?: string; duration?: string },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const duration = body.duration ? parseInt(body.duration, 10) : 0;

    return this.messages.createVoiceMessage(
      user.id,
      file,
      body.recipientId,
      body.groupId,
      duration,
    );
  }

  @Post('media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadMedia(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { recipientId?: string; groupId?: string; type?: string },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.messages.createMediaMessage(
      user.id,
      file,
      body.recipientId,
      body.groupId,
      body.type,
    );
  }

  @Get()
  inbox(@CurrentUser() user: any) {
    return this.messages.inbox(user.id);
  }
}
