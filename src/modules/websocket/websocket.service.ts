import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AIChatMessage, AIConversation } from './entities/ai-chat.entity';
import { SocketUser } from './interfaces/socket.interface';
import * as cookie from 'cookie';

@Injectable()
export class WebSocketService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async authenticateUser(client: Socket): Promise<SocketUser | null> {
    try {
      const token = this.extractTokenFromCookie(client);
      if (!token) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findOne(payload.id);
      if (!user) {
        return null;
      }

      return {
        userId: user.id.toString(),
        username: `${user.firstName} ${user.lastName}`,
        role: user.role,
        socketId: client.id,
      };
    } catch (error) {
      return null;
    }
  }

  private extractTokenFromCookie(client: Socket): string | undefined {
    const cookies = client.handshake.headers.cookie;
    if (!cookies) return undefined;
    const parsedCookies = cookie.parse(cookies);

    return parsedCookies['access_token'];
  }
}
