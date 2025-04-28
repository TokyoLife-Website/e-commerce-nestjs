import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { ProductSku } from '../products/entities/product-sku.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ProductSku]),
    UsersModule,
    ProductsModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
