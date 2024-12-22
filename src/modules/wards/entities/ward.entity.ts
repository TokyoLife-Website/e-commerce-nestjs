import { District } from 'src/modules/districts/entities/district.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity()
export class Ward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  wardId: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => District, (district) => district.wards)
  @JoinColumn({ name: 'districtId' })
  district: District;
}
