import { Category } from 'src/modules/categories/entities/category.entity';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductSku } from './product-sku.entity';
import slugify from 'slugify';
import { DiscountType } from 'src/common/enum/discountType.enum';
import { Review } from 'src/modules/review/entities/review.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'double' })
  price: number;

  @Column({
    type: 'enum',
    enum: DiscountType,
    nullable: true,
    default: DiscountType.NONE,
  })
  discountType: DiscountType;

  @Column({ type: 'double', nullable: true })
  discountValue: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ProductSku, (sku) => sku.product)
  skus: ProductSku[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { default: 0 })
  soldCount: number;

  @Column('float', { default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  reviewCount: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    this.slug = slugify(this.name, { lower: true });
  }
}
