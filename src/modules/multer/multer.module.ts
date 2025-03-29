import { Module } from '@nestjs/common';
import { MulterModule as NestMulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.service';
import { MulterController } from './multer.controller';

@Module({
  imports: [
    NestMulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
  controllers: [MulterController],
  providers: [MulterConfigService],
  exports: [NestMulterModule],
})
export class MulterModule {}
