import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeepseekService } from './deepseek.service';
import { DeepseekController } from './deepseek.controller';

@Module({
  imports: [ConfigModule],
  controllers: [DeepseekController],
  providers: [DeepseekService],
  exports: [DeepseekService],
})
export class DeepseekModule {}
