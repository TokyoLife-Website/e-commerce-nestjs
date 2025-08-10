import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (c) => c.messages)
  conversation: Conversation;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;
}
