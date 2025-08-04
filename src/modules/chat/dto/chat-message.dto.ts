import { IsString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsNumber()
  receiverId: string;
}

export class GetMessagesDto {
  @IsUUID()
  conversationId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class MarkAsReadDto {
  @IsUUID()
  conversationId: string;
}

export class ConversationResponseDto {
  id: string;
  receiverId: string;
  receiver: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: Date;
}

export class MessageResponseDto {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    fullName: string;
    avatar?: string;
  };
}
