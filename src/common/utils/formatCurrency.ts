export function formatCurrency(
  amount: number,
  currency: string = 'VND',
  locale: string = 'vi-VN',
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  // Nếu là VND thì thay ký hiệu ₫ bằng chữ "đ"
  if (currency === 'VND') {
    return formatted.replace('₫', 'đ');
  }

  return formatted;
}
