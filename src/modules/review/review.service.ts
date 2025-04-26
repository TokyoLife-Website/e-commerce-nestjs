import { ConflictException, Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private userService: UsersService,
    private productService: ProductsService,
  ) {}

  async create(
    userId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const user = await this.userService.findOne(userId);
    const product = await this.productService.findOneById(
      createReviewDto.productId,
    );

    const existingReview = await this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: createReviewDto.productId },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this product');
    }

    const review = this.reviewRepository.create({
      user,
      product,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });
    const savedReview = await this.reviewRepository.save(review);
    await this.productService.updateAverageRating(createReviewDto.productId);
    return savedReview;
  }

  findAll() {
    return `This action returns all review`;
  }

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
