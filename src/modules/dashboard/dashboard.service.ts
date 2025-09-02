import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { ProductSku } from '../products/entities/product-sku.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Coupon } from '../coupon/entities/coupon.entity';
import { Review } from '../review/entities/review.entity';
import { OrderStatus } from 'src/common/enum/orderStatus.enum';
import { Role } from 'src/common/enum/role.enum';
import { PeriodType } from 'src/common/enum/periodType.enum';
import { PaymentMethod } from 'src/common/enum/paymentMethode.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProductSku)
    private productSkuRepository: Repository<ProductSku>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  private getDateRange() {
    const now = dayjs();
    const currentMonth = now.startOf('month');
    const previousMonth = now.subtract(1, 'month').startOf('month');

    return {
      currentMonth: currentMonth.toDate(),
      previousMonth: previousMonth.toDate(),
      now: now.toDate(),
    };
  }

  async getDashboardStats() {
    const { currentMonth, previousMonth, now } = this.getDateRange();

    // Lấy dữ liệu tháng hiện tại
    const currentMonthStats = await this.getMonthStats(currentMonth, now);

    // Lấy dữ liệu tháng trước
    const previousMonthStats = await this.getMonthStats(
      previousMonth,
      currentMonth,
    );

    // Tính toán phần trăm thay đổi
    const revenueChange = this.calculatePercentageChange(
      previousMonthStats.totalRevenue,
      currentMonthStats.totalRevenue,
    );

    const ordersChange = this.calculatePercentageChange(
      previousMonthStats.totalOrders,
      currentMonthStats.totalOrders,
    );

    const customersChange = this.calculatePercentageChange(
      previousMonthStats.totalCustomers,
      currentMonthStats.totalCustomers,
    );

    const conversionChange = this.calculatePercentageChange(
      previousMonthStats.conversionRate,
      currentMonthStats.conversionRate,
    );

    return {
      totalRevenue: {
        value: currentMonthStats.totalRevenue,
        change: revenueChange,
      },
      totalOrders: {
        value: currentMonthStats.totalOrders,
        change: ordersChange,
      },
      totalCustomers: {
        value: currentMonthStats.totalCustomers,
        change: customersChange,
      },
      conversionRate: {
        value: currentMonthStats.conversionRate,
        change: conversionChange,
      },
    };
  }

  private async getMonthStats(startDate: Date, endDate: Date) {
    // Tổng doanh thu
    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.DELIVERED],
      })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select('SUM(order.finalAmount)', 'total')
      .getRawOne();

    // Tổng đơn hàng
    const totalOrders = await this.orderRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const customerInMonth = await this.userRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        role: Role.User,
      },
      relations: ['orders'],
      select: ['id', 'createdAt', 'orders'],
    });

    // Tổng khách hàng mới
    const totalCustomers = customerInMonth.length;

    const totalCustomersWithOrders = customerInMonth.filter((customer) => {
      return customer.orders.some((order) => {
        return order.createdAt >= startDate && order.createdAt <= endDate;
      });
    }).length;

    // Tỷ lệ chuyển đổi (đơn hàng / khách hàng)
    const conversionRate =
      totalCustomers > 0
        ? (totalCustomersWithOrders / totalCustomers) * 100
        : 0;

    return {
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      totalOrders,
      totalCustomers,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
    };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  }

  async getRecentOrders(limit: number = 5) {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.sku', 'sku')
      .leftJoinAndSelect('sku.product', 'product')
      .orderBy('order.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getTopProducts(limit: number = 5) {
    const rawProducts = await this.productSkuRepository
      .createQueryBuilder('sku')
      .leftJoinAndSelect('sku.product', 'product')
      .select([
        'product.id as id',
        'product.name as name',
        'product.soldCount as soldCount',
        'product.rating as rating',
        'product.images as images',
        'product.slug as slug',
        'product.finalPrice as finalPrice',
      ])
      .groupBy('product.id')
      .orderBy('product.soldCount', 'DESC')
      .addOrderBy('product.rating', 'DESC')
      .limit(limit)
      .getRawMany();

    return rawProducts.map((p) => ({
      ...p,
      images: p.images ? p.images.split(',') : [],
    }));
  }

  async getOrderStatusDistribution(period?: PeriodType) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count');

    if (period) {
      const now = dayjs();
      const start =
        period === 'week'
          ? now.startOf('week')
          : period === 'month'
            ? now.startOf('month')
            : now.startOf('year');
      qb.where('order.createdAt BETWEEN :start AND :end', {
        start: start.toDate(),
        end: now.toDate(),
      });
    }

    const statusCounts = await qb.groupBy('order.status').getRawMany();

    // Initialize all statuses with 0 count
    const statusDistribution = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.DELIVERING]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.RETURNED]: 0,
    };

    // Fill in actual counts
    statusCounts.forEach((item) => {
      statusDistribution[item.status] = parseInt(item.count);
    });

    return statusDistribution;
  }

  async getRevenueByMonth(months: number = 6) {
    const monthsData = [];
    const now = dayjs();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = now.subtract(i, 'month').startOf('month');
      const endDate = startDate.endOf('month');

      const revenue = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.status IN (:...statuses)', {
          statuses: [OrderStatus.DELIVERED],
        })
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate: startDate.toDate(),
          endDate: endDate.toDate(),
        })
        .select('SUM(order.finalAmount)', 'total')
        .getRawOne();

      monthsData.push({
        month: startDate.format('MMM YYYY'),
        revenue: parseFloat(revenue?.total || '0'),
      });
    }

    return monthsData;
  }

  async getPaymentMethodDistribution() {
    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.paymentMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.paymentMethod')
      .getRawMany();

    const distribution: Record<string, number> = {};
    rows.forEach((r) => {
      distribution[r.method] = parseInt(r.count, 10);
    });

    // Ensure existing known methods are present even if zero
    Object.values(PaymentMethod).forEach((m) => {
      if (distribution[m] === undefined) distribution[m] = 0;
    });

    return distribution;
  }

  async getCustomerGrowth(
    granularity: 'day' | 'month' = 'day',
    range: number = 30,
  ) {
    const now = dayjs();
    const results: { period: string; count: number }[] = [];

    if (granularity === 'day') {
      for (let i = range - 1; i >= 0; i--) {
        const day = now.subtract(i, 'day');
        const start = day.startOf('day');
        const end = day.endOf('day');
        const { count } = await this.userRepository
          .createQueryBuilder('user')
          .where('user.createdAt BETWEEN :start AND :end', {
            start: start.toDate(),
            end: end.toDate(),
          })
          .select('COUNT(*)', 'count')
          .getRawOne();
        results.push({
          period: day.format('YYYY-MM-DD'),
          count: parseInt(count || '0', 10),
        });
      }
    } else {
      for (let i = range - 1; i >= 0; i--) {
        const month = now.subtract(i, 'month');
        const start = month.startOf('month');
        const end = month.endOf('month');
        const { count } = await this.userRepository
          .createQueryBuilder('user')
          .where('user.createdAt BETWEEN :start AND :end', {
            start: start.toDate(),
            end: end.toDate(),
          })
          .select('COUNT(*)', 'count')
          .getRawOne();
        results.push({
          period: month.format('MMM YYYY'),
          count: parseInt(count || '0', 10),
        });
      }
    }

    return results;
  }
}
