export class DashboardStatsDto {
  totalRevenue: {
    value: number;
    change: number;
  };
  totalOrders: {
    value: number;
    change: number;
  };
  totalCustomers: {
    value: number;
    change: number;
  };
  conversionRate: {
    value: number;
    change: number;
  };
}

export class RecentOrderDto {
  id: number;
  code: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: Array<{
    id: number;
    quantity: number;
    price: number;
    productSku: {
      id: number;
      product: {
        id: number;
        name: string;
        slug: string;
      };
    };
  }>;
  finalAmount: number;
  status: string;
  createdAt: Date;
}

export class TopProductDto {
  name: string;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
}

export class OrderStatusDistributionDto {
  status: string;
  count: number;
}

export class RevenueByMonthDto {
  month: string;
  revenue: number;
}

export class DashboardOverviewDto {
  stats: DashboardStatsDto;
  recentOrders: RecentOrderDto[];
  topProducts: TopProductDto[];
  orderStatusDistribution: OrderStatusDistributionDto[];
  revenueByMonth: RevenueByMonthDto[];
}
