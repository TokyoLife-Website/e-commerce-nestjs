// cloudinary.module.ts
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryConfig } from './cloudinary.config';
import { UploadService } from './upload.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Image])],
  controllers: [UploadController],
  providers: [CloudinaryConfig, UploadService],
  exports: [CloudinaryConfig, UploadService],
})
export class UploadModule {}
