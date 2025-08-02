import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreateAIConversationDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class SendAIMessageDto {
  @IsString()
  userMessage: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

export class UpdateAIConversationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  isActive?: boolean;
}

export class AIChatResponseDto {
  @IsString()
  aiResponse: string;

  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
