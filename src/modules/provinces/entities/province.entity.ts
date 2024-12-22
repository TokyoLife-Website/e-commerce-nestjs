import { District } from '../../districts/entities/district.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Province {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  provinceId: number;

  @Column({ length: 255 })
  name: string;

  @OneToMany(() => District, (district) => district.province)
  districts: District[];
}
