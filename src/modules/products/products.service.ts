import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { In, Repository } from 'typeorm';
import { ProductAttribute } from './entities/product-attribute.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSku } from './entities/product-sku.entity';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly categoriesService: CategoriesService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductSku)
    private readonly productSkuRepository: Repository<ProductSku>,
  ) {}

  async createProductAttribute(
    createProductAttributeDto: CreateProductAttributeDto,
  ) {
    return await this.productAttributeRepository.save(
      createProductAttributeDto,
    );
  }

  async createProduct(createProductDto: CreateProductDto) {
    const { skus, categoryId, ...other } = createProductDto;
    const category = await this.categoriesService.findOneById(categoryId);
    const product = this.productRepository.create({
      category,
      ...other,
    });
    const savedProduct = await this.productRepository.save(product);
    const productSkus = skus.map((sku) => {
      const newSku = this.productSkuRepository.create({
        product: savedProduct,
        ...sku,
      });

      return newSku;
    });
    await this.productSkuRepository.save(productSkus);
    return savedProduct;
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
