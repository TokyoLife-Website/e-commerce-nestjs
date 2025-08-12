import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { In, Not, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';
import { ProductSku } from '../products/entities/product-sku.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from 'src/common/enum/orderStatus.enum';
import { OrderItem } from '../orders/entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import {
  ReviewItem,
  ReviewItemTransformer,
} from './transformers/review-item.transformers';
import { ReviewStatus } from 'src/common/enum/reviewStatus.enum';
import { PerspectiveService } from '../perspective/perspective.service';
import { franc } from 'franc';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ProductSku)
    private productSkuRepository: Repository<ProductSku>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private userService: UsersService,
    private productService: ProductsService,
    private perspectiveService: PerspectiveService,
  ) {}

  async create(
    userId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { orderItemId, rating, comment } = createReviewDto;
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['order', 'sku'],
    });

    if (!orderItem) {
      throw new NotFoundException('Order not found');
    }

    if (orderItem.order.userId !== userId)
      throw new ForbiddenException('You cannot review this item');

    if (orderItem.order.status !== OrderStatus.DELIVERED) {
      throw new ForbiddenException(
        'Can only review products from delivered orders',
      );
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { userId, orderItemId },
    });

    if (existingReview || orderItem.isReviewed)
      throw new BadRequestException('You have already reviewed this item');

    await this.userService.findOne(userId);
    const sku = await this.productSkuRepository.findOneBy({
      id: orderItem.sku.id,
    });
    if (!sku) {
      throw new NotFoundException(
        `Product SKU with id ${orderItem.sku.id} not found!`,
      );
    }
    const lang = franc(comment, {
      only: ['eng', 'vie'],
      minLength: 3,
    });
    if (lang !== 'vie') {
      const toxicityScore =
        await this.perspectiveService.analyzeComment(comment);
      if (toxicityScore > 0.5) {
        throw new BadRequestException(
          'Your comment is not allowed, please try again!',
        );
      }
    }

    const review = this.reviewRepository.create({
      userId,
      orderItemId,
      sku: orderItem.sku,
      rating,
      comment,
    });
    orderItem.isReviewed = true;
    await this.orderItemRepository.save(orderItem);
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

  async getMyOrderItemReviews(
    userId: number,
    filters: { status: ReviewStatus },
    { limit, offset, page, size }: Pagination,
  ): Promise<PaginationResource<Partial<ReviewItem>>> {
    const user = await this.userService.findOne(userId);
    if (filters.status === ReviewStatus.REVIEWED) {
      const [reviews, total] = await this.reviewRepository.findAndCount({
        order: {
          createdAt: 'DESC',
        },
        where: {
          userId,
          orderItem: {
            order: {
              status: OrderStatus.DELIVERED,
            },
          },
        },
        relations: ['orderItem', 'orderItem.sku', 'orderItem.sku.product'],
        take: limit,
        skip: offset,
      });

      const items = reviews.map(ReviewItemTransformer.toReviewedItem);

      return {
        items,
        page,
        size,
        totalItems: total,
        totalPages: Math.ceil(total / size),
      };
    } else if (filters.status === ReviewStatus.NOT_REVIEWED) {
      const [orderItems, total] = await this.orderItemRepository.findAndCount({
        relations: ['order', 'sku', 'sku.product'],
        where: {
          isReviewed: false,
          order: { userId, status: OrderStatus.DELIVERED },
        },
        take: limit,
        skip: offset,
        order: {
          order: { createdAt: 'DESC' },
        },
      });

      const items = orderItems.map(ReviewItemTransformer.toNotReviewedItem);

      return {
        items,
        page,
        size,
        totalItems: total,
        totalPages: Math.ceil(total / size),
      };
    }
  }
}
