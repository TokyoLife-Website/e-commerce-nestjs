import { OrderItem } from 'src/modules/orders/entities/order-item.entity';
import { Review } from '../entities/review.entity';

export interface ReviewItem {
  productId: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
  size: string;
  color: string;
  comment?: string;
  rating?: number;
  reviewDate?: Date;
  orderDate?: Date;
  orderItemId: number;
}

export class ReviewItemTransformer {
  static toReviewedItem(review: Review): ReviewItem {
    const oi = review.orderItem;
    const sku = oi.sku;
    const product = sku.product;
    console.log(review);
    return {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images?.[0] ?? null,
      size: sku.size,
      color: sku.color,
      comment: review.comment,
      rating: review.rating,
      reviewDate: review.createdAt,
      orderItemId: oi.id,
    };
  }

  static toNotReviewedItem(orderItem: OrderItem): ReviewItem {
    const sku = orderItem.sku;
    const product = sku.product;
    const order = orderItem.order;

    return {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images?.[0] ?? null,
      size: sku.size,
      color: sku.color,
      orderDate: order.createdAt,
      orderItemId: orderItem.id,
    };
  }
}
