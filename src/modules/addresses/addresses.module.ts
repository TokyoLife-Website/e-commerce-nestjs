import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ProvincesModule } from '../provinces/provinces.module';
import { DistrictsModule } from '../districts/districts.module';
import { WardsModule } from '../wards/wards.module';
import { Address } from './entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, User]),
    ProvincesModule,
    DistrictsModule,
    WardsModule,
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
