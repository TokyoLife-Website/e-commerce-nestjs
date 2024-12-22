import { Province } from 'src/modules/provinces/entities/province.entity';
import { Ward } from 'src/modules/wards/entities/ward.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity()
export class District {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  districtId: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => Province, (province) => province.districts)
  @JoinColumn({ name: 'provinceId' })
  province: Province;

  @OneToMany(() => Ward, (ward) => ward.district)
  wards: Ward[];
}
