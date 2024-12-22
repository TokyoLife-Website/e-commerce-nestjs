import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ward } from './entities/ward.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WardsService {
  constructor(
    @InjectRepository(Ward) private readonly wardRepository: Repository<Ward>,
  ) {}

  async findAllByDistrictId(districtId: number) {
    return await this.wardRepository.findBy({
      district: { districtId },
    });
  }

  async findOne(wardId: number): Promise<Ward> {
    const ward = await this.wardRepository.findOneBy({ wardId });
    if (!ward) throw new NotFoundException(`Ward with ID ${wardId} not found`);
    return ward;
  }
}
