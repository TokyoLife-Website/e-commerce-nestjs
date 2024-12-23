import {
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CustomHttpExceptionFilter } from './common/filters/custom-http-exception.filter';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ConsoleModule } from 'nestjs-console';
import { ImportDataModule } from './modules/import-data/import-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(__dirname, '../../.env')],
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    AddressesModule,
    ConsoleModule,
    ImportDataModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: CustomHttpExceptionFilter },
    { provide: APP_PIPE, useClass: CustomValidationPipe },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    JwtStrategy,
  ],
})
export class AppModule {}
