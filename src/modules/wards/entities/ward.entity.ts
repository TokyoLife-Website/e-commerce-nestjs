import { District } from '../../districts/entities/district.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
@Entity()
export class Ward {
  @PrimaryColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => District, (district) => district.wards)
  district: District;
}
