import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FriendshipsService } from './friendships.service';

@ApiTags('Friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post('request/:userId')
  sendRequest(@CurrentUser() user: any, @Param('userId') receiverId: string) {
    return this.friendshipsService.sendRequest(user.id, receiverId);
  }

  @Post('accept/:userId')
  acceptRequest(@CurrentUser() user: any, @Param('userId') requesterId: string) {
    return this.friendshipsService.acceptRequest(user.id, requesterId);
  }

  @Post('decline/:userId')
  declineRequest(@CurrentUser() user: any, @Param('userId') requesterId: string) {
    return this.friendshipsService.declineRequest(user.id, requesterId);
  }

  @Post('block/:userId')
  blockUser(@CurrentUser() user: any, @Param('userId') blockedId: string) {
    return this.friendshipsService.blockUser(user.id, blockedId);
  }

  @Delete('block/:userId')
  unblockUser(@CurrentUser() user: any, @Param('userId') blockedId: string) {
    return this.friendshipsService.unblockUser(user.id, blockedId);
  }

  @Get()
  getFriends(@CurrentUser() user: any) {
    return this.friendshipsService.getFriends(user.id);
  }

  @Get('pending')
  getPendingRequests(@CurrentUser() user: any) {
    return this.friendshipsService.getPendingRequests(user.id);
  }

  @Get('outgoing')
  getOutgoingRequests(@CurrentUser() user: any) {
    return this.friendshipsService.getOutgoingRequests(user.id);
  }

  @Get('status/:userId')
  getFriendshipStatus(@CurrentUser() user: any, @Param('userId') otherUserId: string) {
    return this.friendshipsService.getFriendshipStatus(user.id, otherUserId);
  }

  @Get('blocked')
  getBlockedUsers(@CurrentUser() user: any) {
    return this.friendshipsService.getBlockedUsers(user.id);
  }
}
