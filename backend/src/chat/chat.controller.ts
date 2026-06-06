import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.id);
  }

  @Get('groups')
  getGroups(@CurrentUser() user: any) {
    return this.chatService.getGroups(user.id);
  }

  @Get('messages')
  getMessages(@CurrentUser() user: any, @Query('targetId') targetId: string, @Query('isGroup') isGroup: string) {
    return this.chatService.getMessages(user.id, targetId, isGroup === 'true');
  }

  @Post('messages')
  sendMessage(
    @CurrentUser() user: any,
    @Body() body: { recipientId: string; content: string; fileUrl?: string; fileType?: string },
  ) {
    return this.chatService.sendDirectMessage(user.id, body.recipientId, body.content, body.fileUrl, body.fileType);
  }

  @Delete('messages/:id')
  deleteMessage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.deleteMessage(user.id, id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) throw new Error('No file provided');
    const url = await this.chatService.uploadFileToDrive(file);
    return { url, fileType: file.mimetype, fileName: file.originalname };
  }

  @Get('gifs/search')
  searchGifs(@Query('q') q: string, @CurrentUser() user: any) {
    return this.chatService.searchGiphy(q ?? '');
  }

  @Delete('conversations/:id')
  deleteConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.deleteConversation(user.id, id);
  }
}
