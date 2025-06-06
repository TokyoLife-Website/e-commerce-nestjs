import { DiscountType } from '../enum/discountType.enum';

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
