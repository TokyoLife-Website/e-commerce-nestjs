import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AIChatMessage, AIConversation } from './entities/ai-chat.entity';
import { SocketUser } from './interfaces/socket.interface';
import { SendAIMessageDto } from './dto/ai-chat.dto';

@Injectable()
export class WebSocketService {
  constructor(
    @InjectRepository(AIChatMessage)
    private aiChatMessageRepository: Repository<AIChatMessage>,
    @InjectRepository(AIConversation)
    private aiConversationRepository: Repository<AIConversation>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async authenticateUser(client: Socket): Promise<SocketUser | null> {
    try {
      const token = this.extractTokenFromHeader(client);
      if (!token) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        return null;
      }

      return {
        userId: user.id.toString(),
        username: `${user.firstName} ${user.lastName}`,
        role: user.role,
        socketId: client.id,
      };
    } catch (error) {
      return null;
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const auth =
      client.handshake.auth.token || client.handshake.headers.authorization;
    if (!auth) {
      return undefined;
    }

    const [type, token] = auth.split(' ') ?? [];
    return type === 'Bearer' ? token : auth;
  }

  // AI Chat Methods
  async processAIMessage(
    userId: string,
    data: SendAIMessageDto,
  ): Promise<AIChatMessage> {
    let conversationId = data.conversationId;

    // Create new conversation if not provided
    if (!conversationId) {
      const conversation = this.aiConversationRepository.create({
        userId,
        title: data.userMessage.substring(0, 50) + '...',
      });
      const savedConversation =
        await this.aiConversationRepository.save(conversation);
      conversationId = savedConversation.id;
    }

    // TODO: Integrate with DeepSeek AI API
    // For now, return a mock response
    const aiResponse = `This is a mock AI response to: "${data.userMessage}". In the future, this will be integrated with DeepSeek AI.`;

    const aiMessage = this.aiChatMessageRepository.create({
      userId,
      conversationId,
      userMessage: data.userMessage,
      aiResponse,
      metadata: {
        model: 'deepseek-chat',
        tokens: 150,
        timestamp: new Date().toISOString(),
      },
    });

    return await this.aiChatMessageRepository.save(aiMessage);
  }

  async getAIConversations(userId: string): Promise<AIConversation[]> {
    return await this.aiConversationRepository.find({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async getAIConversationMessages(
    conversationId: string,
  ): Promise<AIChatMessage[]> {
    return await this.aiChatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
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
}
