import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: any) {
    return this.users.findById(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: any) {
    return this.users.update(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file) throw new Error('No file provided');
    const avatarUrl = await this.users.uploadAvatar(file);
    return this.users.update(user.id, { avatarUrl });
  }

  /** Search platform members by name or email (used by chat "New Chat" modal). */
  @Get('search')
  search(@Query('q') q: string, @CurrentUser() user: any) {
    return this.users.search(q ?? '', user.id);
  }

  /** Returns list of currently online users (full objects). */
  @Get('online')
  online(@CurrentUser() user: any) {
    return this.users.online(user.id);
  }

  /** Get user by ID. */
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.users.findById(id);
  }
}

