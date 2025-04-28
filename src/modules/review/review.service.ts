import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';
import { ProductSku } from '../products/entities/product-sku.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ProductSku)
    private productSkuRepository: Repository<ProductSku>,
    private userService: UsersService,
    private productService: ProductsService,
  ) {}

  async create(
    userId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const user = await this.userService.findOne(userId);
    const sku = await this.productSkuRepository.findOneBy({
      id: createReviewDto.skuId,
    });
    if (!sku) {
      throw new NotFoundException(
        `Product SKU with id ${createReviewDto.skuId} not found!`,
      );
    }
    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId: userId,
        skuId: createReviewDto.skuId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this product');
    }

    const review = this.reviewRepository.create({
      user,
      sku,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });
    const savedReview = await this.reviewRepository.save(review);
    await this.productService.updateAverageRating(sku.productId);
    return savedReview;
  }

  async findAll(
    filters: { productId: string; rating?: string },
    { limit, offset, page, size }: Pagination,
  ): Promise<PaginationResource<Partial<Review>>> {
    const where: any = {};
    if (!filters.productId) {
      throw new BadRequestException('product Id is required');
    }
    where.sku = { productId: filters.productId };
    if (filters.rating) {
      const starNumber = parseInt(filters.rating);
      if (isNaN(starNumber) || starNumber < 1 || starNumber > 5) {
        throw new BadRequestException('star must be a number between 1 and 5');
      }
      where.rating = filters.rating;
    }
    const [reviews, total] = await this.reviewRepository.findAndCount({
      order: {
        createdAt: 'DESC',
      },
      where,
      take: limit,
      skip: offset,
      relations: ['user', 'sku'],
    });
    return {
      items: reviews,
      page,
      size,
      totalItems: total,
      totalPages: Math.ceil(total / size),
    };
  }
}
