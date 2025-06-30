import { Coupon } from 'src/modules/coupon/entities/coupon.entity';
import { CouponStatus } from '../enum/couponStatus.enum';
import * as dayjs from 'dayjs';
import { BadRequestException } from '@nestjs/common';

export const validateCoupon = (coupon: Coupon, cartTotal: number): void => {
  const now = dayjs();

  if (!coupon || coupon.status !== CouponStatus.ACTIVE) {
    throw new BadRequestException('Coupon is invalid or inactive');
  }

  if (
    dayjs(coupon.startDate).isAfter(now) ||
    dayjs(coupon.endDate).isBefore(now)
  ) {
    throw new BadRequestException('Coupon is expired or not yet active');
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new BadRequestException('Coupon has been fully used');
  }

  if (coupon.minOrderAmout && cartTotal < coupon.minOrderAmout) {
    throw new BadRequestException(
      'Order does not meet minimum amount for coupon',
    );
  }
};
