import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class MulterService {
  private uploadPath = join(process.cwd(), 'assets', 'uploads');
  async deleteImage(filename: string): Promise<{ message: string }> {
    const filePath = join(this.uploadPath, filename);
    try {
      await unlink(filePath);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}
