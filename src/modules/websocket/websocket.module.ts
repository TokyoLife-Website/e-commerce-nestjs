import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGatewayClass } from './websocket.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatModule } from '../chat/chat.module';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    NotificationModule,
    ChatModule,
  ],
  providers: [WebSocketGatewayClass, WsJwtAuthGuard, WebSocketService],
})
export class WebSocketModule {}
