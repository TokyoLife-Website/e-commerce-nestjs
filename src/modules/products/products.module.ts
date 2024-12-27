import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductSku } from './entities/product-sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductAttribute, ProductSku])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
