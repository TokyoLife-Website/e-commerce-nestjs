import { Injectable } from '@nestjs/common';
import {
  MulterOptionsFactory,
  MulterModuleOptions,
} from '@nestjs/platform-express';
import * as multer from 'multer';
import * as fs from 'fs';
import { join } from 'path';

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
          const fileName = `${uniqueSuffix}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
      preservePath: false,
    };
  }
}
