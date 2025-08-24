import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  public_id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ length: 100 })
  folder: string;

  @Column({ length: 10 })
  format: string;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
