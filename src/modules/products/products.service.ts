import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSku } from './entities/product-sku.entity';
import { Product } from './entities/product.entity';
import { CategoriesService } from '../categories/categories.service';
import { Pagination } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';
import { ProductSkuDto } from './dto/create-product-sku.entity';
import { MulterService } from '../multer/multer.service';
import { Review } from '../review/entities/review.entity';
import { SearchProductsDto } from './dto/search-product.dto';
import { SortType } from 'src/common/enum/sortType.enum';
import { DiscountType } from 'src/common/enum/discountType.enum';

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

  private applySorting(
    query: SelectQueryBuilder<Product>,
    sort?: SortType,
  ): SelectQueryBuilder<Product> {
    console.log(sort);
    if (!sort) {
      return query.orderBy('product.createdAt', 'DESC');
    }

    switch (sort) {
      case SortType.RATING_DESC:
        return query.orderBy('product.rating', 'DESC');

      case SortType.RATING_ASC:
        return query.orderBy('product.rating', 'ASC');

      case SortType.LATEST_DESC:
        return query.orderBy('product.createdAt', 'DESC');

      case SortType.LATEST_ASC:
        return query.orderBy('product.createdAt', 'ASC');

      case SortType.PRICE_ASC:
        return query.orderBy('product.finalPrice', 'ASC');

      case SortType.PRICE_DESC:
        return query.orderBy('product.finalPrice', 'DESC');

      case SortType.NAME_ASC:
        return query.orderBy('product.name', 'ASC');

      case SortType.NAME_DESC:
        return query.orderBy('product.name', 'DESC');

      case SortType.DISCOUNT_DESC:
        query = query.addSelect(
          `
          CASE
            WHEN product.discountType = '${DiscountType.PERCENTAGE}' THEN (product.price * product.discountValue / 100)
            WHEN product.discountType = '${DiscountType.FIXED}' THEN product.discountValue
            ELSE 0
          END
          `,
          'actualDiscount',
        );
        return query.orderBy('actualDiscount', 'DESC');

      case SortType.DISCOUNT_ASC:
        query = query.addSelect(
          `
          CASE
            WHEN product.discountType = '${DiscountType.PERCENTAGE}' THEN (product.price * product.discountValue / 100)
            WHEN product.discountType = '${DiscountType.FIXED}' THEN product.discountValue
            ELSE 0
          END
          `,
          'actualDiscount',
        );
        return query.orderBy('actualDiscount', 'ASC');

      case SortType.SOLD_DESC:
        return query.orderBy('product.soldCount', 'DESC');

      default:
        return query.orderBy('product.createdAt', 'DESC');
    }
  }

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

  async findAll(
    { limit, offset, page, size }: Pagination,
    dto: SearchProductsDto,
  ): Promise<PaginationResource<Partial<Product>>> {
    const { keyword, color, price, sort } = dto;

    let query = this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :status', { status: true });

    // const [products, total] = await this.productRepository.findAndCount({
    //   relations: ['category', 'skus'],
    //   order: { createdAt: 'DESC' },
    //   take: limit,
    //   skip: offset,
    // });

    if (keyword) {
      query = query.andWhere(
        `(
          LOWER(product.name) LIKE LOWER(:keyword) OR 
          LOWER(product.description) LIKE LOWER(:keyword) 
        )`,
        { keyword: `%${keyword}%` },
      );
    }

    // Price range filter
    if (price && price.min !== undefined && price.max !== undefined) {
      query = query.andWhere(
        'product.price >= :minPrice AND product.price <= :maxPrice',
        { minPrice: price.min, maxPrice: price.max },
      );
    }

    query = this.applySorting(query, sort);

    if (color) {
      query.leftJoinAndSelect('product.skus', 'sku');
      query = query.andWhere('LOWER(sku.color) = LOWER(:color)', { color });
    }

    const total = await query.getCount();

    query = query.skip(offset).take(limit);

    const products = await query.getMany();

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

  async findOneBySlug(
    slug: string,
  ): Promise<Product & { starCounts: { [star: number]: number } }> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['skus'],
    });
    if (!product) throw new NotFoundException(`Product not found`);
    const starCounts = await this.getStarCounts(product.id);
    const result = Object.assign(
      Object.create(Object.getPrototypeOf(product)),
      product,
      { starCounts },
    );
    return result;
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

  private async getStarCounts(
    productId: number,
  ): Promise<{ [star: number]: number }> {
    const skus = await this.productSkuRepository.find({
      where: { productId },
      relations: ['reviews'],
    });
    const allReviews = skus.flatMap((sku) =>
      sku.reviews.filter((r) => r.isActive),
    );
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of allReviews) {
      if (review.rating >= 1 && review.rating <= 5) {
        starCounts[review.rating]++;
      }
    }
    return starCounts;
  }
}
