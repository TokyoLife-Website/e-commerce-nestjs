import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  async findAll(): Promise<Province[]> {
    return await this.provinceRepository.find({});
  }

  async findOne(id: number): Promise<Province> {
    const province = await this.provinceRepository.findOneBy({ id });
    if (!province)
      throw new NotFoundException(`Province with ID ${id} not found`);
    return province;
  }
}
