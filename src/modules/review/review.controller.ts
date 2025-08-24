import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
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
import { ReviewStatus } from 'src/common/enum/reviewStatus.enum';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(Role.User)
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

  @Get('admin')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  getAllReviewsForAdmin(
    @FilterParams(['rating', 'isActive'])
    filters: { rating?: string; isActive?: boolean },
    @PaginationParams() paginationParams: Pagination,
  ) {
    return this.reviewService.getAllReviewsForAdmin(filters, paginationParams);
  }

  @Get('products')
  async getProductsByReviewStatus(
    @FilterParams(['status'])
    filters: { status: ReviewStatus },
    @PaginationParams() paginationParams: Pagination,
    @UserParams() user: User,
  ) {
    return this.reviewService.getMyOrderItemReviews(
      user.id,
      filters,
      paginationParams,
    );
  }

  @Patch(':id/status')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  updateReviewStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewStatusDto: UpdateReviewStatusDto,
  ) {
    return this.reviewService.updateReviewStatus(
      id,
      updateReviewStatusDto.isActive,
    );
  }
}
