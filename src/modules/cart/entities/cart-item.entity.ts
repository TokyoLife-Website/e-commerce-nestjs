import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { ProductSku } from 'src/modules/products/entities/product-sku.entity';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cart, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => ProductSku, { eager: true })
  sku: ProductSku;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'double', default: 0 })
  total: number;
}
