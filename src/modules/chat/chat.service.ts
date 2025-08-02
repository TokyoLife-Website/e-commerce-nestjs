import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateChatMessageDto } from './dto/chat-message.dto';

@Injectable()
export class ChatService {
  private userSocketMap = new Map<string, string>(); // userId -> socketId

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  // Socket Management
  async addUserToSocketMap(userId: string, socketId: string): Promise<void> {
    this.userSocketMap.set(userId, socketId);
  }

  async removeUserFromSocketMap(userId: string): Promise<void> {
    this.userSocketMap.delete(userId);
  }

  async getUserSocketId(userId: string): Promise<string | undefined> {
    return this.userSocketMap.get(userId);
  }

  // Chat Message Methods
  async createChatMessage(
    senderId: string,
    data: CreateChatMessageDto,
  ): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      senderId,
      receiverId: data.receiverId,
      content: data.content,
      type: data.type,
      roomId: data.roomId,
    });

    return await this.chatMessageRepository.save(message);
  }

  async getChatMessages(
    userId: string,
    otherUserId?: string,
    roomId?: string,
  ): Promise<ChatMessage[]> {
    const query = this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.senderId = :userId OR message.receiverId = :userId', {
        userId,
      });

    if (otherUserId) {
      query.andWhere(
        '(message.senderId = :otherUserId OR message.receiverId = :otherUserId)',
        { otherUserId },
      );
    }

    if (roomId) {
      query.andWhere('message.roomId = :roomId', { roomId });
    }

    return await query.orderBy('message.createdAt', 'ASC').getMany();
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await this.chatMessageRepository.update(
      { id: messageId, receiverId: userId },
      { isRead: true },
    );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return await this.chatMessageRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async getRecentChats(userId: string, limit = 10): Promise<ChatMessage[]> {
    const query = this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.senderId = :userId OR message.receiverId = :userId', {
        userId,
      })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    return await query.getMany();
  }

  // Room Methods (for future group chat functionality)
  async createRoom(
    name: string,
    participants: string[],
  ): Promise<{ id: string; name: string }> {
    // This is a placeholder for room creation
    // In a real implementation, you would have a Room entity
    return {
      id: `room_${Date.now()}`,
      name,
    };
  }

  async getRoomParticipants(roomId: string): Promise<string[]> {
    // This is a placeholder for getting room participants
    // In a real implementation, you would query the Room entity
    return [];
  }
}
