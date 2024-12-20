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
      district: { id: districtId },
    });
  }

  async findOne(id: number): Promise<Ward> {
    const ward = await this.wardRepository.findOneBy({ id });
    if (!ward) throw new NotFoundException(`Ward with ID ${id} not found`);
    return ward;
  }
}
