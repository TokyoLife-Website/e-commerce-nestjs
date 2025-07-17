export enum SortType {
  RATING_DESC = 'rating_desc', // Đánh giá cao → thấp
  RATING_ASC = 'rating_asc', // Đánh giá thấp → cao

  LATEST_DESC = 'latest_desc', // Mới nhất → cũ nhất
  LATEST_ASC = 'latest_asc', // Cũ nhất → mới nhất

  PRICE_ASC = 'price_asc', // Giá thấp → cao
  PRICE_DESC = 'price_desc', // Giá cao → thấp

  NAME_ASC = 'name_asc', // Tên A → Z
  NAME_DESC = 'name_desc', // Tên Z → A

  DISCOUNT_DESC = 'discount_desc', // Giảm giá nhiều → ít
  DISCOUNT_ASC = 'discount_asc', // Giảm giá ít → nhiều

  SOLD_DESC = 'sold_desc', // Bán chạy nhất
}
