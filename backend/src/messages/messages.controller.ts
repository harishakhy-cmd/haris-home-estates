import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

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

  @Get()
  inbox(@CurrentUser() user: any) {
    return this.messages.inbox(user.id);
  }
}
