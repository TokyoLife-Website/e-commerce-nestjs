import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blacklist')
export class Blacklist {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  refreshToken: string;

  @UpdateDateColumn({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
