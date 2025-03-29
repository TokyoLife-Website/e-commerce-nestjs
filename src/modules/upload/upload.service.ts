// cloudinary.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Image } from './entities/image.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}
  async uploadSingleImage(file: Express.Multer.File, folderStore?: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
    const { public_id, url, format, width, height, folder }: UploadApiResponse =
      await cloudinary.uploader.upload(dataURI, {
        folder: folderStore,
        resource_type: 'image',
      });
    const image = this.imageRepository.create({
      public_id,
      url,
      format,
      width,
      height,
      folder,
    });
    return this.imageRepository.save(image);
  }

  async uploadMutipleImages(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }
    return await Promise.all(files.map((file) => this.uploadSingleImage(file)));
  }

  async deleteImage(id: number) {
    const image = await this.imageRepository.findOneBy({ id });
    if (!image) throw new NotFoundException('Image not found!');
    const result = await cloudinary.uploader.destroy(image.public_id);
    if (result.result !== 'ok') {
      throw new NotFoundException('Failed to delete image from Cloudinary');
    }
    await this.imageRepository.remove(image);
  }
}
