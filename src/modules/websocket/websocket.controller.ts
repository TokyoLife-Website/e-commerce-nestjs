import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import {
  CreateChatMessageDto,
  MarkMessageAsReadDto,
} from './dto/chat-message.dto';

import { SendAIMessageDto } from './dto/ai-chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('websocket')
@UseGuards(JwtAuthGuard)
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  // Chat endpoints
  @Get('chat/messages')
  async getChatMessages(
    @Request() req,
    @Query('otherUserId') otherUserId?: string,
    @Query('roomId') roomId?: string,
  ) {
    const userId = req.user.id.toString();
    return await this.webSocketService.getChatMessages(
      userId,
      otherUserId,
      roomId,
    );
  }

  @Post('chat/messages')
  async createChatMessage(@Request() req, @Body() data: CreateChatMessageDto) {
    const userId = req.user.id.toString();
    return await this.webSocketService.createChatMessage(userId, data);
  }

  @Put('chat/messages/:messageId/read')
  async markMessageAsRead(
    @Request() req,
    @Param() params: MarkMessageAsReadDto,
  ) {
    const userId = req.user.id.toString();
    await this.webSocketService.markMessageAsRead(params.messageId, userId);
    return { success: true };
  }

  // AI Chat endpoints
  @Get('ai/conversations')
  async getAIConversations(@Request() req) {
    const userId = req.user.id.toString();
    return await this.webSocketService.getAIConversations(userId);
  }

  @Get('ai/conversations/:conversationId/messages')
  async getAIConversationMessages(
    @Param('conversationId') conversationId: string,
  ) {
    return await this.webSocketService.getAIConversationMessages(
      conversationId,
    );
  }

  @Post('ai/messages')
  async sendAIMessage(@Request() req, @Body() data: SendAIMessageDto) {
    const userId = req.user.id.toString();
    return await this.webSocketService.processAIMessage(userId, data);
  }
}
