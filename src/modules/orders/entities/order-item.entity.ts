import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductSku } from 'src/modules/products/entities/product-sku.entity';
import { Review } from 'src/modules/review/entities/review.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @Column({ type: 'double' })
  price: number;

  @Column({ type: 'double' })
  total: number;

  @Column({ type: 'boolean', default: false })
  isReviewed: boolean;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductSku)
  @JoinColumn({ name: 'sku_id' })
  sku: ProductSku;

  @OneToMany(() => Review, (review) => review.orderItem)
  reviews: Review[];
}
