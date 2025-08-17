import { CanActivate, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';
import { UsersService } from '../../users/users.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromCookie(client);
      if (!token) {
        throw new WsException('Unauthorized access');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findOne(payload.id);
      if (!user) {
        throw new WsException('User not found');
      }

      // Attach user to socket data
      client.data.user = {
        userId: user.id,
        username: `${user.firstName} ${user.lastName}`,
        role: user.role,
        socketId: client.id,
      };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized access');
    }
  }

  private extractTokenFromCookie(client: Socket): string | undefined {
    const cookies = client.handshake.headers.cookie;
    if (!cookies) return undefined;
    const parsedCookies = cookie.parse(cookies);

    return parsedCookies['access_token'];
  }
}
