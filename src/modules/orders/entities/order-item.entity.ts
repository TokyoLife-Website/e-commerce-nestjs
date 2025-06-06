import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductSku } from 'src/modules/products/entities/product-sku.entity';

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

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductSku)
  @JoinColumn({ name: 'sku_id' })
  sku: ProductSku;
}
