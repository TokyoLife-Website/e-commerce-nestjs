import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import {
  ConversationResponseDto,
  MessageResponseDto,
  SendMessageDto,
} from './dto/chat-message.dto';

@Injectable()
export class ChatService {
  private userSocketMap = new Map<string, string>(); // userId -> socketId

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
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

  // Find or create conversation between two users
  async findOrCreateConversation(
    senderId: string,
    receiverId: string,
  ): Promise<Conversation> {
    // Check if conversation exists (either direction)
    let conversation = await this.conversationRepository.findOne({
      where: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      relations: ['sender', 'receiver'],
    });

    if (!conversation) {
      // Create new conversation
      conversation = this.conversationRepository.create({
        senderId,
        receiverId,
      });
      conversation = await this.conversationRepository.save(conversation);

      // Load relations
      conversation = await this.conversationRepository.findOne({
        where: { id: conversation.id },
        relations: ['sender', 'receiver'],
      });
    }

    return conversation;
  }

  // Get conversations list for a user
  async getConversations(userId: string): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.sender', 'sender')
      .leftJoinAndSelect('sender.avatar', 'senderAvatar')
      .leftJoinAndSelect('conversation.receiver', 'receiver')
      .leftJoinAndSelect('receiver.avatar', 'receiverAvatar')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'messageSender')
      .where(
        'conversation.senderId = :userId OR conversation.receiverId = :userId',
        { userId },
      )
      .orderBy('conversation.createdAt', 'DESC')
      .getMany();

    const result: ConversationResponseDto[] = [];

    for (const conversation of conversations) {
      // Determine the other user (receiver from current user's perspective)
      const otherUser =
        conversation.senderId === userId
          ? conversation.receiver
          : conversation.sender;

      // Get last message
      const lastMessage =
        conversation.messages && conversation.messages.length > 0
          ? conversation.messages.reduce((latest, current) =>
              new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest,
            )
          : null;

      // Count unread messages where current user is NOT the sender
      const unreadCount = await this.messageRepository.count({
        where: {
          conversation: { id: conversation.id },
          senderId: otherUser.id.toString(),
          isRead: false,
        },
      });

      result.push({
        id: conversation.id,
        receiverId: otherUser.id.toString(),
        receiver: {
          id: otherUser.id.toString(),
          fullName: `${otherUser.firstName} ${otherUser.lastName}`,
          email: otherUser.email,
          avatar: otherUser.avatar?.url || null,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount,
        updatedAt: lastMessage?.createdAt || conversation.createdAt,
      });
    }

    // Sort by last message time (most recent first)
    return result.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  // Get messages in a conversation
  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: MessageResponseDto[]; total: number }> {
    // Verify user has access to this conversation
    const conversation = await this.conversationRepository.findOne({
      where: {
        id: conversationId,
        // User must be either sender or receiver
      },
      relations: ['sender', 'receiver'],
    });

    if (
      !conversation ||
      (conversation.senderId !== userId && conversation.receiverId !== userId)
    ) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: ['sender', 'sender.avatar'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const messageResponseDto: MessageResponseDto[] = messages.map(
      (message) => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id.toString(),
          fullName: `${message.sender.firstName} ${message.sender.lastName}`,
          avatar: message.sender.avatar?.url || null,
        },
      }),
    );

    return {
      messages: messageResponseDto.reverse(), // Reverse to show oldest first
      total,
    };
  }

  // Send a new message
  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const { content, conversationId } = sendMessageDto;

    // Find or create conversation
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    // Create message
    const message = this.messageRepository.create({
      conversation,
      senderId,
      content,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Load sender info
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'sender.avatar'],
    });

    return {
      id: messageWithSender.id,
      content: messageWithSender.content,
      senderId: messageWithSender.senderId,
      isRead: messageWithSender.isRead,
      createdAt: messageWithSender.createdAt,
      sender: {
        id: messageWithSender.sender.id.toString(),
        fullName: `${messageWithSender.sender.firstName} ${messageWithSender.sender.lastName}`,
        avatar: messageWithSender.sender.avatar?.url || null,
      },
    };
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Verify user has access to this conversation
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (
      !conversation ||
      (conversation.senderId !== userId && conversation.receiverId !== userId)
    ) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Mark all messages in this conversation as read where current user is NOT the sender
    await this.messageRepository.update(
      {
        conversation: { id: conversationId },
        senderId:
          userId === conversation.senderId
            ? conversation.receiverId
            : conversation.senderId,
        isRead: false,
      },
      { isRead: true },
    );
  }
}
