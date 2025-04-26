import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductSku } from './entities/product-sku.entity';
import { CategoriesModule } from '../categories/categories.module';
import { MulterModule } from '../multer/multer.module';
import { Review } from '../review/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductAttribute, ProductSku, Review]),
    CategoriesModule,
    MulterModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
