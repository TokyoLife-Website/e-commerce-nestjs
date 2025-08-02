import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PerspectiveService } from './perspective.service';

@Module({
  imports: [HttpModule],
  providers: [PerspectiveService],
  exports: [PerspectiveService],
})
export class PerspectiveModule {}
