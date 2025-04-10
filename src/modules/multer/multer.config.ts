import { Injectable } from '@nestjs/common';
import {
  MulterOptionsFactory,
  MulterModuleOptions,
} from '@nestjs/platform-express';
import * as multer from 'multer';
import * as fs from 'fs';
import { extname, join } from 'path';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    const uploadDir = join(process.cwd(), 'assets/uploads');
    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const cleanOriginal = file.originalname
            .replace(/\s+/g, '_')
            .replace(ext, '');
          const fileName = `${cleanOriginal}-${uniqueSuffix}${ext}`;
          cb(null, fileName);
        },
      }),
      preservePath: false,
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB (tuỳ chỉnh)
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error('Invalid file type. Only JPG, PNG, WEBP allowed.'),
            false,
          );
        }
      },
    };
  }
}
