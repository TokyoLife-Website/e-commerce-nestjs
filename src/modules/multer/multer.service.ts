import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';

@Injectable()
export class MulterService {
  private uploadPath = join(process.cwd(), 'assets', 'uploads');

  async deleteImage(filename: string): Promise<{ message: string }> {
    const filePath = join(this.uploadPath, filename);
    try {
      // Check if file exists before attempting to delete
      await access(filePath, constants.F_OK);
      await unlink(filePath);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      // If file doesn't exist, consider it already deleted
      if (error.code === 'ENOENT') {
        return { message: 'Image already deleted or does not exist' };
      }
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}
