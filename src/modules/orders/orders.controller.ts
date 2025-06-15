import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../users/entities/user.entity';
import { UserParams } from 'src/common/decorators/user.decorator';
import { OrderStatus } from 'src/common/enum/orderStatus.enum';
import { FilterParams } from 'src/common/decorators/filter-params.decorator';
import {
  Pagination,
  PaginationParams,
} from 'src/common/decorators/pagination-params.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@UserParams() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  findAll(
    @FilterParams(['status'])
    filters: { status: OrderStatus },
    @PaginationParams() paginationParams: Pagination,
    @UserParams() user: User,
  ) {
    return this.ordersService.findAll(user.id, filters, paginationParams);
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.ordersService.findOne(code);
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() newStatus: OrderStatus) {
    return this.ordersService.updateStatus(code, newStatus);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.ordersService.remove(code);
  }
}
