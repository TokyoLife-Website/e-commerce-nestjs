import { ProductSku } from 'src/modules/products/entities/product-sku.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => ProductSku, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skuId' })
  sku: ProductSku;

  @Column({ nullable: true })
  skuId: number;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
