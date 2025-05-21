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
    console.log(createProductDto);
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  @Public()
  findAll(@PaginationParams() paginationParams: Pagination) {
    return this.productsService.findAll(paginationParams);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOneById(id);
  }

  @Get('slug/:slug')
  @Public()
  findOneBySlug(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }
}
