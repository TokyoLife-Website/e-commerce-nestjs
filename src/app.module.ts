import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { CustomHttpExceptionFilter } from './common/filters/custom-http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(__dirname, '../../.env')],
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: CustomHttpExceptionFilter },
    { provide: APP_PIPE, useClass: ValidationPipe },
  ],
})
export class AppModule {}
