import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { Public } from 'src/common/decorators/public.decorator';
import { WardsService } from '../wards/wards.service';

@Public()
@Controller('districts')
export class DistrictsController {
  constructor(
    private readonly districtsService: DistrictsService,
    private readonly wardsService: WardsService,
  ) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.districtsService.findOne(id);
  }

  @Get(':id/districts')
  findAllDistrictsByProvince(@Param('id', ParseIntPipe) id: number) {
    return this.districtsService.findAllByProvinceId(id);
  }

  @Get(':id/wards')
  findAllWardsByDistrict(@Param('id', ParseIntPipe) id: number) {
    return this.wardsService.findAllByDistrictId(id);
  }
}
