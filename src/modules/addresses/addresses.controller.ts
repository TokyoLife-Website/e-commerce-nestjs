import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { User } from '../users/entities/user.entity';
import { UserParams } from 'src/common/decorators/user.decorator';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  async create(
    @UserParams() user: User,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return await this.addressesService.create(user.id, createAddressDto);
  }

  @Patch(':id')
  async update(
    @UserParams() user: User,
    @Param('id', ParseIntPipe) addressId: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return await this.addressesService.update(
      +addressId,
      user.id,
      updateAddressDto,
    );
  }

  @Delete(':id')
  @ResponseMessage('Address has been removed!')
  async remove(
    @Param('id', ParseIntPipe) addressId: number,
    @UserParams() user: User,
  ) {
    await this.addressesService.remove(addressId, user.id);
  }
}
