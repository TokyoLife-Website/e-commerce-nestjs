import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { PeriodType } from 'src/common/enum/periodType.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@Roles(Role.Admin)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('recent-orders')
  async getRecentOrders(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 5;
    return this.dashboardService.getRecentOrders(limitNumber);
  }

  @Get('top-products')
  async getTopProducts(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 5;
    return this.dashboardService.getTopProducts(limitNumber);
  }

  @Get('order-status-distribution')
  async getOrderStatusDistribution(@Query('period') period?: PeriodType) {
    return this.dashboardService.getOrderStatusDistribution(period);
  }

  @Get('revenue-by-month')
  async getRevenueByMonth(@Query('months') months?: string) {
    const monthsNumber = months ? parseInt(months) : 6;
    return this.dashboardService.getRevenueByMonth(monthsNumber);
  }

  @Get('payment-method-distribution')
  async getPaymentMethodDistribution() {
    return this.dashboardService.getPaymentMethodDistribution();
  }

  @Get('customer-growth')
  async getCustomerGrowth(
    @Query('granularity') granularity?: 'day' | 'month',
    @Query('range') range?: string,
  ) {
    const rangeNum = range
      ? parseInt(range)
      : granularity === 'month'
        ? 12
        : 30;
    return this.dashboardService.getCustomerGrowth(
      granularity || 'day',
      rangeNum,
    );
  }

  @Get('overview')
  async getDashboardOverview() {
    const [
      stats,
      recentOrders,
      topProducts,
      orderStatusDistribution,
      revenueByMonth,
    ] = await Promise.all([
      this.dashboardService.getDashboardStats(),
      this.dashboardService.getRecentOrders(5),
      this.dashboardService.getTopProducts(5),
      this.dashboardService.getOrderStatusDistribution(),
      this.dashboardService.getRevenueByMonth(6),
    ]);

    return {
      stats,
      recentOrders,
      topProducts,
      orderStatusDistribution,
      revenueByMonth,
    };
  }
}
