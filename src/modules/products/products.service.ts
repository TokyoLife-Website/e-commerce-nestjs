import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { DataSource, In, Repository } from 'typeorm';
import { ProductAttribute } from './entities/product-attribute.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSku } from './entities/product-sku.entity';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoriesService } from '../categories/categories.service';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly categoriesService: CategoriesService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSku)
    private readonly productSkuRepository: Repository<ProductSku>,
    private readonly dataSource: DataSource,
  ) {}

  // async createProductAttribute(
  //   createProductAttributeDto: CreateProductAttributeDto,
  // ) {
  //   return await this.productAttributeRepository.save(
  //     createProductAttributeDto,
  //   );
  // }

  async createProduct(createProductDto: CreateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { skus, categoryId, ...other } = createProductDto;
      const category = await this.categoriesService.findOneById(categoryId);
      const isProductExisting = await queryRunner.manager.findOne(
        this.productRepository.target,
        {
          where: { name: createProductDto.name },
        },
      );
      if (isProductExisting)
        throw new BadRequestException('Product already exists');
      const product = queryRunner.manager.create(
        this.productRepository.target,
        {
          category,
          ...other,
        },
      );
      const savedProduct = await queryRunner.manager.save(product);
      const skuCodes = skus.map((skuItem) => {
        const productNameSku = String(savedProduct.id).padStart(6, '0');
        const colorSku = skuItem.color.charAt(0).toUpperCase();
        const sizeSku = skuItem.size.toUpperCase();
        return `${productNameSku}-${colorSku}-${sizeSku}`;
      });
      const uniqueSkuCodes = new Set(skuCodes);
      if (uniqueSkuCodes.size !== skuCodes.length) {
        throw new BadRequestException(
          'Some SKU codes are duplicated in the request',
        );
      }

      const existingSkus = await queryRunner.manager.find(
        this.productSkuRepository.target,
        {
          where: { sku: In([...uniqueSkuCodes]) },
        },
      );

      if (existingSkus.length > 0) {
        throw new BadRequestException(
          'Some SKUs already exist in the database',
        );
      }

      const productSkus = skus.map((skuItem, index) => {
        const newSku = this.productSkuRepository.create({
          product: savedProduct,
          sku: skuCodes[index],
          ...skuItem,
        });
        return newSku;
      });
      await queryRunner.manager.save(productSkus);
      await queryRunner.commitTransaction();

      return savedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll({
    limit,
    offset,
    page,
    size,
  }: Pagination): Promise<PaginationResource<Partial<Product>>> {
    const [products, total] = await this.productRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return {
      items: products,
      page,
      size,
      totalItems: total,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOneById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['skus'],
    });
    if (!product) throw new NotFoundException(`Product with #${id} not found`);
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOneById(id);
    const { categoryId, skus, ...other } = updateProductDto;
    if (categoryId) {
      const category = await this.categoriesService.findOneById(categoryId);
      product.category = category;
    }
    Object.assign(product, other);
    await this.productRepository.save(product);
    if (skus) {
      const existingSkus = product.skus;
      const skusToDelete = existingSkus.filter(
        (existingSku) => !skus.some((sku) => sku.id === existingSku.id),
      );
      if (skusToDelete.length > 0) {
        await this.productSkuRepository.remove(skusToDelete);
      }
      const skuSavePromises = skus.map(async (sku) => {
        if (sku.id) {
          const existingSku = await this.productSkuRepository.findOneBy({
            id: sku.id,
          });
          if (existingSku) Object.assign(existingSku, sku);
          return this.productSkuRepository.save(existingSku);
        } else {
          const newSku = this.productSkuRepository.create({
            ...sku,
            product,
          });
          return this.productSkuRepository.save(newSku);
        }
      });
      await Promise.all(skuSavePromises);
    }
    return product;
  }
}
