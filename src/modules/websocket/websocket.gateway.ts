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
import { SocketUser } from './interfaces/socket.interface';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatService } from '../chat/chat.service';
import { SendMessageDto } from '../chat';
import { WebSocketService } from './websocket.service';

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
    private readonly chatService: ChatService,
    private readonly webSocketService: WebSocketService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.webSocketService.authenticateUser(client);
      if (!user) {
        client.disconnect();
        return;
      }
      await this.chatService.addUserToSocketMap(user.userId, client.id);
      client.data.user = user;

      await client.join(`user:${user.userId}`);

      if (user.role === 'admin') {
        await client.join('admin:room');
      }
      console.log(`User ${user.username} connected with socket ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user as SocketUser;
      if (user) {
        await this.chatService.removeUserFromSocketMap(user.userId);
        console.log(`User ${user.username} disconnected`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
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

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const user = client.data.user as SocketUser;
      const message = await this.chatService.sendMessage(user.userId, data);
      this.server
        .to(`room:${data.conversationId}`)
        .emit('send_message', message);
      client.to('admin:room').emit('last_message_update');
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to send message',
        code: 'SEND_MESSAGE_ERROR',
      });
    }
  }

  @SubscribeMessage('room:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    try {
      const user = client.data.user as SocketUser;
      client.to(`room:${data.conversationId}`).emit('room:typing', {
        userId: user.userId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      client.emit('system:error', {
        message: 'Failed to send typing status',
        code: 'TYPING_ERROR',
      });
    }
  }

  @OnEvent('notification.created')
  async handleNotificationCreated(payload: {
    userId: string;
    notification: any;
    socketId?: string;
  }) {
    try {
      if (payload.socketId) {
        this.server
          .to(payload.socketId)
          .emit('notification:new', payload.notification);
      } else {
        this.server
          .to(`user:${payload.userId}`)
          .emit('notification:new', payload.notification);
      }
    } catch (error) {
      console.error('Failed to send notification via WebSocket:', error);
    }
  }
}
