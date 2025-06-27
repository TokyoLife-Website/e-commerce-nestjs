import { Coupon } from 'src/modules/coupon/entities/coupon.entity';
import { DiscountType } from '../enum/discountType.enum';
import { CouponType } from '../enum/couponType.enum';

export const calculateDiscountedPrice = (
  basePrice: number,
  discountType: DiscountType,
  discountValue: number,
): number => {
  if (discountType === DiscountType.PERCENTAGE) {
    return basePrice - (basePrice * discountValue) / 100;
  } else if (discountType === DiscountType.FIXED) {
    return basePrice - discountValue;
  }
  return basePrice;
};

export const calculateDiscount = (coupon: Coupon, total: number): number => {
  if (coupon.type === CouponType.PERCENTAGE) {
    let discount = (total * coupon.value) / 100;
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
    return discount;
  }

  if (coupon.type === CouponType.FIXED) {
    return coupon.value;
  }

  return 0;
};
