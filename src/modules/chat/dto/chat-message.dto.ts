import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { MessageType } from '../entities/chat-message.entity';

export class CreateChatMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;
}

export class UpdateChatMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}

export class MarkMessageAsReadDto {
  @IsUUID()
  messageId: string;
}

export class JoinRoomDto {
  @IsUUID()
  roomId: string;
}

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  participants?: string[];
}
