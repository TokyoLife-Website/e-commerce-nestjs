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
import {
  CreateChatMessageDto,
  MarkMessageAsReadDto,
} from './dto/chat-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  async getChatMessages(
    @Request() req,
    @Query('otherUserId') otherUserId?: string,
    @Query('roomId') roomId?: string,
  ) {
    const userId = req.user.id.toString();
    return await this.chatService.getChatMessages(userId, otherUserId, roomId);
  }

  @Post('messages')
  async createChatMessage(@Request() req, @Body() data: CreateChatMessageDto) {
    const userId = req.user.id.toString();
    return await this.chatService.createChatMessage(userId, data);
  }

  @Put('messages/:messageId/read')
  async markMessageAsRead(
    @Request() req,
    @Param() params: MarkMessageAsReadDto,
  ) {
    const userId = req.user.id.toString();
    await this.chatService.markMessageAsRead(params.messageId, userId);
    return { success: true };
  }

  @Get('unread-count')
  async getUnreadMessageCount(@Request() req) {
    const userId = req.user.id.toString();
    const count = await this.chatService.getUnreadMessageCount(userId);
    return { count };
  }

  @Get('recent')
  async getRecentChats(@Request() req, @Query('limit') limit = 10) {
    const userId = req.user.id.toString();
    return await this.chatService.getRecentChats(
      userId,
      parseInt(limit.toString()),
    );
  }
}
