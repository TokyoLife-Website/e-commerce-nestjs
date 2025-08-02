import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGatewayClass } from './websocket.gateway';
import { WebSocketController } from './websocket.controller';
import { WebSocketService } from './websocket.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { AIChatMessage, AIConversation } from './entities/ai-chat.entity';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([AIChatMessage, AIConversation]),
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
  controllers: [WebSocketController],
  providers: [WebSocketGatewayClass, WebSocketService, WsJwtAuthGuard],
  exports: [WebSocketService],
})
export class WebSocketModule {}
