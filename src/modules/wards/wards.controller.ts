import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { WardsService } from './wards.service';

@Controller('wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) {}
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wardsService.findOne(id);
  }
}
