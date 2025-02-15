import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = +configService.get<number>('PORT');
  app.enableCors({
    origin: [configService.get<string>('CLIENT_BASE_URL')],
  });
  await app.listen(PORT);
}
bootstrap();
