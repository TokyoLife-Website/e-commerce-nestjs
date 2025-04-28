import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSku } from './entities/product-sku.entity';
import { Product } from './entities/product.entity';
import { CategoriesService } from '../categories/categories.service';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';
import { ProductSkuDto } from './dto/create-product-sku.entity';
import { MulterService } from '../multer/multer.service';
import { Review } from '../review/entities/review.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly categoriesService: CategoriesService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSku)
    private readonly productSkuRepository: Repository<ProductSku>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly dataSource: DataSource,
    private readonly multerService: MulterService,
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
          stock: skus?.reduce((total, sku) => total + sku.quantity, 0) || 0,
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
      relations: ['category', 'skus'],
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

  async findOneBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['skus'],
    });
    if (!product) throw new NotFoundException(`Product not found`);
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      const product = await this.findOneById(id);
      const { categoryId, skus, ...other } = updateProductDto;
      if (categoryId) {
        const category = await this.categoriesService.findOneById(categoryId);
        product.category = category;
      }
      const oldImages = product.images || [];
      const newImages = other.images || [];
      const deletedImages = oldImages.filter(
        (image) => !newImages.includes(image),
      );
      console.log(deletedImages);
      if (deletedImages.length > 0) {
        for (const imageUrl of deletedImages) {
          const fileName = imageUrl.split('/').pop();
          await this.multerService.deleteImage(fileName);
        }
      }
      product.images = newImages;
      product.stock =
        skus?.reduce((total, sku) => total + sku.quantity, 0) || 0;
      Object.assign(product, other);
      await manager.save(product);
      if (skus) {
        const { newSkus, updateSkus, deleteSkuIds } =
          await this.covertDataUpdateProductSkus(skus, product.id);
        if (deleteSkuIds.length > 0) {
          await manager.delete(ProductSku, deleteSkuIds);
        }
        await manager.save(ProductSku, newSkus);
        for (const sku of updateSkus) {
          await manager.update(ProductSku, sku.id, {
            size: sku.size,
            color: sku.color,
            quantity: sku.quantity,
            sku: `${String(product.id).padStart(6, '0')}-${sku.color
              .charAt(0)
              .toUpperCase()}-${sku.size.toUpperCase()}`,
          });
        }
      }
      return product;
    });
  }

  async updateAverageRating(productId: number) {
    const product = await this.findOneById(productId);
    const skus = await this.productSkuRepository.find({
      where: { productId },
      relations: ['reviews'],
    });
    const allReviews = skus.flatMap((sku) =>
      sku.reviews.filter((r) => r.isActive),
    );
    console.log(allReviews);

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      product.rating = parseFloat((totalRating / allReviews.length).toFixed(1));
      product.reviewCount = allReviews.length;
    } else {
      product.rating = 0;
      product.reviewCount = 0;
    }
    await this.productRepository.save(product);
  }

  async covertDataUpdateProductSkus(
    skus: Array<ProductSkuDto>,
    productId: number,
  ) {
    const newSkus = skus
      .filter((item) => !item?.id)
      .map((item) => ({
        productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        sku: `${String(productId).padStart(6, '0')}-${item.color.charAt(0).toUpperCase()}-${item.size.toUpperCase()}`,
      }));

    let updateSkus = [];
    let deleteSkuIds = [];

    const existingSkus = await this.productSkuRepository.find({
      where: {
        productId,
      },
    });

    for (const existing of existingSkus) {
      const matched = skus.find((sku) => sku.id === existing.id);
      if (matched) {
        // Check if any field was actually changed
        const isUpdated =
          matched.size !== existing.size ||
          matched.color !== existing.color ||
          matched.quantity !== existing.quantity;

        if (isUpdated) {
          updateSkus.push({
            id: existing.id,
            size: matched.size,
            color: matched.color,
            quantity: matched.quantity,
          });
        }
      } else {
        deleteSkuIds.push(existing.id);
      }
    }

    return {
      newSkus,
      updateSkus,
      deleteSkuIds,
    };
  }
}
