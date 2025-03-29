import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MulterConfigService } from './multer.service';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('multer')
export class MulterController {
  constructor(private readonly multerConfigService: MulterConfigService) {}

  @Post('single')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return `http://localhost:8080/uploads/${file.filename}`;
  }

  // Upload nhiều ảnh
  @Post('multiple')
  @Public()
  @UseInterceptors(FilesInterceptor('files', 5)) // Giới hạn tối đa 5 ảnh
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map(
      (file) => `http://localhost:8080/uploads/${file.filename}`,
    );
  }

  // Xóa ảnh theo tên file
  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string) {
    const filePath = `./uploads/${filename}`;
    // return this.uploadService.deleteFile(filePath);
  }
}
