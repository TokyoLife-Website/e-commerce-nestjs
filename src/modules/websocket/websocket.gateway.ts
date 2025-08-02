import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WebSocketService } from './websocket.service';
import { SocketUser } from './interfaces/socket.interface';
import { CreateChatMessageDto } from './dto/chat-message.dto';
import { SendAIMessageDto } from './dto/ai-chat.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification/notification.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_BASE_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
@UseGuards(WsJwtAuthGuard)
export class WebSocketGatewayClass
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.webSocketService.authenticateUser(client);
      if (user) {
        await this.webSocketService.addUserToSocketMap(user.userId, client.id);
        client.data.user = user;

        // Join user to their personal room
        await client.join(`user:${user.userId}`);

        // If user is admin, join admin room
        if (user.role === 'admin') {
          await client.join('admin:room');
        }

        this.server.emit('user:connect', user);
        console.log(`User ${user.username} connected with socket ${client.id}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user as SocketUser;
      if (user) {
        await this.webSocketService.removeUserFromSocketMap(user.userId);
        this.server.emit('user:disconnect', user.userId);
        console.log(`User ${user.username} disconnected`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateChatMessageDto,
  ) {
    try {
      const user = client.data.user as SocketUser;
      const message = await this.webSocketService.createChatMessage(
        user.userId,
        data,
      );

      // Emit to sender
      client.emit('chat:message', message);

      // Emit to receiver or room
      if (data.receiverId) {
        const receiverSocketId = await this.webSocketService.getUserSocketId(
          data.receiverId,
        );
        if (receiverSocketId) {
          this.server.to(receiverSocketId).emit('chat:message', message);
        }
      } else if (data.roomId) {
        this.server.to(`room:${data.roomId}`).emit('chat:message', message);
      }
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to send message',
        code: 'CHAT_ERROR',
      });
    }
  }

  @SubscribeMessage('chat:typing')
  async handleChatTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId?: string; isTyping: boolean },
  ) {
    try {
      const user = client.data.user as SocketUser;

      if (data.roomId) {
        this.server.to(`room:${data.roomId}`).emit('chat:typing', {
          userId: user.userId,
          roomId: data.roomId,
          isTyping: data.isTyping,
        });
      } else {
        // For direct messages, emit to specific user
        // This would need to be implemented based on your chat logic
      }
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to send typing status',
        code: 'TYPING_ERROR',
      });
    }
  }

  @SubscribeMessage('chat:read')
  async handleChatRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageId: string,
  ) {
    try {
      const user = client.data.user as SocketUser;
      await this.webSocketService.markMessageAsRead(messageId, user.userId);

      this.server.emit('chat:read', {
        messageId,
        userId: user.userId,
      });
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to mark message as read',
        code: 'READ_ERROR',
      });
    }
  }

  @SubscribeMessage('ai:message')
  async handleAIMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendAIMessageDto,
  ) {
    try {
      const user = client.data.user as SocketUser;

      // Emit typing indicator
      client.emit('ai:typing', { userId: user.userId, isTyping: true });

      // Process AI message
      const aiResponse = await this.webSocketService.processAIMessage(
        user.userId,
        data,
      );

      // Stop typing indicator
      client.emit('ai:typing', { userId: user.userId, isTyping: false });

      // Send AI response
      client.emit('ai:message', aiResponse);
    } catch (error) {
      const user = client.data.user as SocketUser;
      client.emit('ai:typing', { userId: user.userId, isTyping: false });
      client.emit('system:error', {
        message: 'Failed to process AI message',
        code: 'AI_ERROR',
      });
    }
  }

  @SubscribeMessage('ai:typing')
  async handleAITyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() isTyping: boolean,
  ) {
    try {
      const user = client.data.user as SocketUser;
      client.emit('ai:typing', { userId: user.userId, isTyping });
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to send AI typing status',
        code: 'AI_TYPING_ERROR',
      });
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    try {
      const user = client.data.user as SocketUser;
      await client.join(`room:${roomId}`);

      this.server.to(`room:${roomId}`).emit('room:join', {
        userId: user.userId,
        roomId,
      });
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to join room',
        code: 'ROOM_JOIN_ERROR',
      });
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    try {
      const user = client.data.user as SocketUser;
      await client.leave(`room:${roomId}`);

      this.server.to(`room:${roomId}`).emit('room:leave', {
        userId: user.userId,
        roomId,
      });
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to leave room',
        code: 'ROOM_LEAVE_ERROR',
      });
    }
  }

  @SubscribeMessage('room:create')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name: string; participants: string[] },
  ) {
    try {
      const user = client.data.user as SocketUser;
      const room = await this.webSocketService.createRoom(
        data.name,
        data.participants,
      );

      // Join all participants to the room
      for (const participantId of data.participants) {
        const participantSocketId =
          await this.webSocketService.getUserSocketId(participantId);
        if (participantSocketId) {
          this.server.to(participantSocketId).emit('room:create', {
            roomId: room.id,
            name: room.name,
            participants: data.participants,
          });
        }
      }
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to create room',
        code: 'ROOM_CREATE_ERROR',
      });
    }
  }

  // Listen for notification events from other services
  @OnEvent('notification.created')
  async handleNotificationCreated(payload: {
    userId: string;
    notification: any;
    socketId?: string;
  }) {
    try {
      if (payload.socketId) {
        // Send to specific user if socketId is provided
        this.server
          .to(payload.socketId)
          .emit('notification:new', payload.notification);
      } else {
        // Send to user's personal room
        this.server
          .to(`user:${payload.userId}`)
          .emit('notification:new', payload.notification);
      }
    } catch (error) {
      console.error('Failed to send notification via WebSocket:', error);
    }
  }
}
