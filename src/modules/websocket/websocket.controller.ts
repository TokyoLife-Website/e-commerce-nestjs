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

import { SendAIMessageDto } from './dto/ai-chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('websocket')
@UseGuards(JwtAuthGuard)
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

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
