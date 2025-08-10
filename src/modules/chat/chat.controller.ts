import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  SendMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
} from './dto/chat-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Lấy danh sách cuộc trò chuyện
  @Get('conversations')
  async getConversations(@Request() req): Promise<ConversationResponseDto[]> {
    return this.chatService.getConversations(req.user.id);
  }

  // Lấy tin nhắn trong một cuộc trò chuyện
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ messages: MessageResponseDto[]; total: number }> {
    return this.chatService.getMessages(
      conversationId,
      req.user.id,
      page || 1,
      limit || 50,
    );
  }

  // Gửi tin nhắn mới
  @Post('messages')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req,
  ): Promise<MessageResponseDto> {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  // Cập nhật trạng thái đã đọc
  @Put('conversations/:conversationId/read')
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.chatService.markAsRead(conversationId, req.user.id);
    return { message: 'Messages marked as read successfully' };
  }

  // Tìm hoặc tạo cuộc trò chuyện với user khác
  @Post('conversations')
  async findOrCreateConversation(
    @Body('receiverId') receiverId: string,
    @Request() req,
  ): Promise<{ conversationId: string }> {
    console.log({ receiverId, userId: req.user.id });
    const conversation = await this.chatService.findOrCreateConversation(
      req.user.id,
      receiverId,
    );
    return { conversationId: conversation.id };
  }
}
