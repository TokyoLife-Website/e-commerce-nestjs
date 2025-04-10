import { Module } from '@nestjs/common';
import { MulterModule as NestMulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { MulterController } from './multer.controller';
import { MulterService } from './multer.service';

@Module({
  imports: [
    NestMulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
  controllers: [MulterController],
  providers: [MulterConfigService, MulterService],
  exports: [NestMulterModule, MulterService],
})
export class MulterModule {}
