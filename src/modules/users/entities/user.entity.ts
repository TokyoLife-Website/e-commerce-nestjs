import * as bcrypt from 'bcrypt';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Gender } from 'src/common/enum/gender.enum';
import { Role } from 'src/common/enum/role.enum';
import { Address } from 'src/modules/addresses/entities/address.entity';
import { WishList } from 'src/modules/wishlist/entities/wishlist.entity';
import { Cart } from 'src/modules/cart/entities/cart.entity';
import { Image } from '../../upload/entities/image.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Image, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  avatar: Image;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender: Gender;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => WishList, (wishlist) => wishlist.user)
  wishlist: WishList[];

  @OneToOne(() => Cart, (carts) => carts.user, { cascade: true })
  @JoinColumn()
  carts: Cart[];

  @Column({ length: 6, unique: true, nullable: true })
  otp?: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpires?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
