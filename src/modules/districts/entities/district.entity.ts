import { Province } from '../../provinces/entities/province.entity';
import { Ward } from '../../wards/entities/ward.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
@Entity()
export class District {
  @PrimaryColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => Province, (province) => province.districts)
  province: Province;

  @OneToMany(() => Ward, (ward) => ward.district)
  wards: Ward;
}
