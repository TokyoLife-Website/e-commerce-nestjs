import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async create(userId: number, createAddressDto: CreateAddressDto) {
    const { provinceId, districtId, wardId, ...other } = createAddressDto;
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found!`);
    }
    const userAddresses = await this.findAllByUserId(userId);
    if (userAddresses.length === 0) {
      other.isDefault = true;
    } else {
      if (other.isDefault) {
        await this.addressRepository.update(
          { user, isDefault: true },
          { isDefault: false },
        );
      }
    }
    const [province, district, ward] = await Promise.all([
      this.provincesService.findOne(provinceId),
      this.districtsService.findOne(districtId),
      this.wardsService.findOne(wardId),
    ]).catch((error) => {
      throw new BadRequestException(error.message);
    });
    // const province = await this.provincesService.findOne(provinceId);
    // const district = await this.districtsService.findOne(districtId);
    // const ward = await this.wardsService.findOne(wardId);
    const newAddress = this.addressRepository.create({
      user,
      province,
      district,
      ward,
      ...other,
    });
    return await this.addressRepository.save(newAddress);
  }

  async findAllByUserId(userId: number): Promise<Address[]> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found!`);
    }
    return await this.addressRepository.find({
      where: { user: { id: userId } },
      relations: ['province', 'district', 'ward', 'user'],
    });
  }

  async update(
    addressId: number,
    userId: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const { provinceId, districtId, wardId, ...other } = updateAddressDto;
    const address = await this.findOne(addressId, userId);
    provinceId &&
      (address.province = await this.provincesService.findOne(provinceId));
    districtId &&
      (address.district = await this.districtsService.findOne(districtId));
    wardId && (address.ward = await this.wardsService.findOne(wardId));
    Object.assign(address, other);
    if (other.isDefault) {
      await this.addressRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }
    return await this.addressRepository.save(address);
  }

  async findOne(addressId: number, userId: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
      relations: ['province', 'district', 'ward'],
    });
    if (!address) {
      throw new NotFoundException(`Address with id ${addressId} not found!`);
    }
    return address;
  }

  async remove(addressId: number, userId: number) {
    const address = await this.findOne(addressId, userId);
    if (address.isDefault) {
      throw new BadRequestException(`Cannot delete default address!`);
    }
    await this.addressRepository.remove(address);
  }
}
