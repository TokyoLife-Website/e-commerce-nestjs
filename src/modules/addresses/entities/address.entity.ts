import { AddressType } from 'src/common/enum/addressType.enum';
import { District } from 'src/modules/districts/entities/district.entity';
import { Province } from 'src/modules/provinces/entities/province.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Ward } from 'src/modules/wards/entities/ward.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  detail: string;

  @Column()
  userId: number;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @ManyToOne(() => User, (user) => user.addresses)
  user: User;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'enum', enum: AddressType, default: AddressType.HOME })
  type: AddressType;

  @ManyToOne(() => Province)
  province: Province;

  @ManyToOne(() => District)
  district: District;

  @ManyToOne(() => Ward)
  ward: Ward;
}
