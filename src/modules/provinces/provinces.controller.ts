import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { Public } from 'src/common/decorators/public.decorator';
import { DistrictsService } from '../districts/districts.service';

@Public()
@Controller('provinces')
export class ProvincesController {
  constructor(
    private readonly provincesService: ProvincesService,
    private readonly districtsService: DistrictsService,
  ) {}

  @Get()
  findAll() {
    return this.provincesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.provincesService.findOne(id);
  }

  @Get(':id/districts')
  findAllDistrictsByProvince(@Param('id', ParseIntPipe) id: number) {
    return this.districtsService.findAllByProvinceId(id);
  }
}
