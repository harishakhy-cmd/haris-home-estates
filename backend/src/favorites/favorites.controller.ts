import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.favorites.list(user.id);
  }

  @Post(':propertyId')
  add(@CurrentUser() user: any, @Param('propertyId') propertyId: string) {
    return this.favorites.add(user.id, propertyId);
  }

  @Delete(':propertyId')
  remove(@CurrentUser() user: any, @Param('propertyId') propertyId: string) {
    return this.favorites.remove(user.id, propertyId);
  }
}
