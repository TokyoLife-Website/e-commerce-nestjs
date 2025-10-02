import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PdfService } from '../pdf/pdf.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  create(@UserParams() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.User)
  findAll(
    @FilterParams(['status'])
    filters: { status: OrderStatus },
    @PaginationParams() paginationParams: Pagination,
    @UserParams() user: User,
  ) {
    return this.ordersService.findAll(user.id, filters, paginationParams);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  findAllForAdmin(
    @FilterParams(['status', 'userId'])
    filters: { status: OrderStatus; userId: number },
    @PaginationParams() paginationParams: Pagination,
  ) {
    return this.ordersService.findAllForAdmin(filters, paginationParams);
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.ordersService.findOne(code);
  }

  @Patch(':code')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  update(
    @Param('code') code: string,
    @Body() body: { newStatus: OrderStatus },
  ) {
    return this.ordersService.updateStatus(code, body.newStatus);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.ordersService.remove(code);
  }

  @Get(':code/pdf')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async downloadOrderPdf(@Param('code') code: string, @Res() res: Response) {
    try {
      const order = await this.ordersService.findOne(code);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const pdfBuffer = await this.pdfService.generateOrderPdf(order);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${code}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      return res.status(500).json({ message: 'Error generating PDF' });
    }
  }
}
