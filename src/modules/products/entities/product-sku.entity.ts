import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Review } from 'src/modules/review/entities/review.entity';

@Entity()
export class ProductSku {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.skus, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  sku: string;

  @OneToMany(() => Review, (review) => review.sku)
  reviews: Review[];

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
}
