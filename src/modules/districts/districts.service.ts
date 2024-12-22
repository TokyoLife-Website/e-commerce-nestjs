import { Injectable, NotFoundException } from '@nestjs/common';
import { District } from './entities/district.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DistrictsService {
  constructor(
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
  ) {}

  async findAllByProvinceId(provinceId: number) {
    return await this.districtRepository.findBy({
      province: { provinceId },
    });
  }

  async findOne(districtId: number): Promise<District> {
    const district = await this.districtRepository.findOneBy({ districtId });
    if (!district)
      throw new NotFoundException(`Distrit with ID ${districtId} not found`);
    return district;
  }
}
