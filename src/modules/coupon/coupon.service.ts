import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { CouponType } from 'src/common/enum/couponType.enum';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const { code, type, value } = createCouponDto;

    const existingCoupon = await this.couponRepository.findOneBy({ code });

    if (existingCoupon)
      throw new BadRequestException('This coupon is already existing');

    const startDate = dayjs(createCouponDto.startDate);
    const endDate = dayjs(createCouponDto.endDate);
    if (startDate.isAfter(endDate) || startDate.isSame(endDate))
      throw new BadRequestException('startDate must be less than endDate');

    if (type === CouponType.PERCENTAGE && value > 100)
      throw new BadRequestException('Discount percentage cannot exceed 100%');

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    });

    return await this.couponRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) throw new NotFoundException(`Coupon #${code} not found`);
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);

    // Update only the status field
    if (updateCouponDto.status !== undefined) {
      coupon.status = updateCouponDto.status;
    }

    return await this.couponRepository.save(coupon);
  }

  async remove(id: number): Promise<void> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);

    // Check if coupon has been used
    if (coupon.usedCount > 0) {
      throw new BadRequestException('Cannot delete coupon that has been used');
    }

    await this.couponRepository.remove(coupon);
  }
}
