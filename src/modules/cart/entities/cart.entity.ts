import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Coupon } from 'src/modules/coupon/entities/coupon.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.carts, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @ManyToOne(() => Coupon, { nullable: true })
  coupon?: Coupon;

  @Column({ type: 'double', default: 0 })
  discountAmount: number;

  @Column({ type: 'double', default: 0 })
  total: number;

  @Column({ type: 'double', default: 0 })
  finalAmount: number;
}
