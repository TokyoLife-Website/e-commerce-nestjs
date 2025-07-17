import { Module } from '@nestjs/common';
import { ImportDataService } from './import-data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from '../provinces/entities/province.entity';
import { District } from '../districts/entities/district.entity';
import { Ward } from '../wards/entities/ward.entity';
import { ImportDataCommand } from './import-data.command';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Province, District, Ward]),
    ProductsModule,
  ],
  providers: [ImportDataService, ImportDataCommand],
  exports: [ImportDataService],
})
export class ImportDataModule {}
