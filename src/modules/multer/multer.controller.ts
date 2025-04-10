import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/common/decorators/public.decorator';
import { MulterService } from './multer.service';

@Controller('multer')
export class MulterController {
  constructor(private readonly multerService: MulterService) {}

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
  @Public()
  async deleteFile(@Param('filename') filename: string) {
    return this.multerService.deleteImage(filename);
  }
}
