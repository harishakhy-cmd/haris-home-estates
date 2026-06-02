import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateLandlordReviewDto, CreateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('landlords/:landlordId')
  listLandlordReviews(@Param('landlordId') landlordId: string) {
    return this.reviews.listLandlordReviews(landlordId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('landlords')
  createLandlordReview(@CurrentUser() user: any, @Body() dto: CreateLandlordReviewDto) {
    return this.reviews.createLandlordReview(user.id, dto);
  }

  @Get(':propertyId')
  list(@Param('propertyId') propertyId: string) {
    return this.reviews.list(propertyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }
}
