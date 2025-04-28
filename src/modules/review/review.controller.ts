import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';
import { UserParams } from 'src/common/decorators/user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Public } from 'src/common/decorators/public.decorator';
import {
  Pagination,
  PaginationParams,
} from 'src/common/decorators/pagination-params.decorator';
import { FilterParams } from 'src/common/decorators/filter-params.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  create(@UserParams() user: User, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(user.id, createReviewDto);
  }

  @Get()
  @Public()
  findAll(
    @FilterParams(['productId', 'rating'])
    filters: { productId: string; rating?: string },
    @PaginationParams() paginationParams: Pagination,
  ) {
    return this.reviewService.findAll(filters, paginationParams);
  }
}
