import { District } from '../../districts/entities/district.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
@Entity()
export class Province {
  @PrimaryColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @OneToMany(() => District, (district) => district.province)
  districts: District[];
}
