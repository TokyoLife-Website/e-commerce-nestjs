export interface CreatePaymentUrlDto {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl?: string;
  ipAddr: string;
  locale?: string;
}
