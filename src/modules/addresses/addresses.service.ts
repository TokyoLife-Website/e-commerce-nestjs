import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ProvincesService } from '../provinces/provinces.service';
import { DistrictsService } from '../districts/districts.service';
import { WardsService } from '../wards/wards.service';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private provincesService: ProvincesService,
    private districtsService: DistrictsService,
    private wardsService: WardsService,
  ) {}

  async create(createAddressDto: CreateAddressDto) {
    const { userId, provinceId, districtId, wardId, ...other } =
      createAddressDto;
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found!`);
    }
    const userAddresses = await this.addressRepository.find({
      where: { userId: user.id },
    });
    console.log(userAddresses);
    if (userAddresses.length === 0) {
      other.isDefault = true;
    } else {
      await this.addressRepository.update(
        { user, isDefault: true },
        { isDefault: false },
      );
    }
    const province = await this.provincesService.findOne(provinceId);
    const district = await this.districtsService.findOne(districtId);
    const ward = await this.wardsService.findOne(wardId);
    const newAddress = this.addressRepository.create({
      user,
      province,
      district,
      ward,
      ...other,
    });
    return await this.addressRepository.save(newAddress);
  }

  findAll() {
    return `This action returns all addresses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} address`;
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return `This action updates a #${id} address`;
  }

  remove(id: number) {
    return `This action removes a #${id} address`;
  }
}
