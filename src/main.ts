import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.use('/uploads', express.static(join(process.cwd(), 'assets/uploads')));
  const configService = app.get(ConfigService);
  const PORT = +configService.get<number>('PORT');
  app.enableCors({
    origin: [configService.get<string>('CLIENT_BASE_URL')],
    credentials: true,
  });
  await app.listen(PORT);
}
bootstrap();
