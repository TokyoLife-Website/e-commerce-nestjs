import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductSku {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.skus, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  product: Product;

  @Column()
  productId: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  sku: string;

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
    if (this.product && this.color && this.size) {
      const productNameSku = this.product.slug
        .split('-')
        .reduce((acc, part) => acc + part.charAt(0).toUpperCase(), '');
      const colorSku = this.color.charAt(0).toUpperCase();
      const sizeSku = this.size.toUpperCase();
      this.sku = `${productNameSku}-${colorSku}-${sizeSku}`;
      this.sku = `${productNameSku}-${this.color.charAt(0).toUpperCase()}-${this.size.toUpperCase()}`;
    }
  }
}
