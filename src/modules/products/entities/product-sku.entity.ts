import { ProductAtributeType } from 'src/common/enum/productAtributeType.enum';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import slugify from 'slugify';

@Entity()
export class ProductSku {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.skus, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column()
  productId: number;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  // @Column({ type: 'simple-json', nullable: true })
  // attributes: Record<ProductAtributeType, string>;

  @Column({ type: 'varchar' })
  size: string;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  generateSku() {
    if (!this.sku) {
      const productNameSlug = slugify(this.product.name, { lower: true });
      const attributesSlug = `${this.color}-${this.size}`;
      this.sku = `${productNameSlug}-${attributesSlug}`;
    }
  }
}
