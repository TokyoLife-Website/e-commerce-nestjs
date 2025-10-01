import { OrderStatus } from 'src/common/enum/orderStatus.enum';
import { PaymentMethod } from 'src/common/enum/paymentMethode.enum';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Coupon } from 'src/modules/coupon/entities/coupon.entity';
import { OrderStatusHistory } from './order-status-history.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({ default: 0 })
  discount: number;

  @Column({ default: 0 })
  shippingFee: number;

  @Column({ type: 'double', default: 0 })
  total: number;

  @Column({ type: 'double', default: 0 })
  finalAmount: number;

  @ManyToOne(() => Coupon, { nullable: true })
  coupon?: Coupon;

  @Column({ nullable: true })
  note: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order, {
    cascade: true,
  })
  orderStatusHistory: OrderStatusHistory[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
