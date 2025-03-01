import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { UploadService } from './upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Public()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleImage(@UploadedFile() file: Express.Multer.File) {
    return await this.uploadService.uploadSingleImage(file);
  }

  @Post('mutiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMutipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.uploadService.uploadMutipleImages(files);
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: number) {
    return this.uploadService.deleteImage(id);
  }
}
