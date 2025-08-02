import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from 'src/common/enum/role.enum';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  Pagination,
  PaginationParams,
} from 'src/common/decorators/pagination-params.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { SearchProductsDto } from './dto/search-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // @Post()
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  // async createNewAttribute(
  //   @Body() createProductAttributeDto: CreateProductAttributeDto,
  // ) {
  //   return this.productsService.createProductAttribute(
  //     createProductAttributeDto,
  //   );
  // }

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  @Public()
  async findAll(
    @PaginationParams() paginationParams: Pagination,
    @Query(ValidationPipe) dto: SearchProductsDto,
  ) {
    return await this.productsService.findAll(paginationParams, dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.findOneById(id);
  }

  @Get('slug/:slug')
  @Public()
  async findOneBySlug(@Param('slug') slug: string) {
    return await this.productsService.findOneBySlug(slug);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(id, updateProductDto);
  }
}
