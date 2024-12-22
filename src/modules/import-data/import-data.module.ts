import { Module } from '@nestjs/common';
import { ImportDataService } from './import-data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from '../provinces/entities/province.entity';
import { District } from '../districts/entities/district.entity';
import { Ward } from '../wards/entities/ward.entity';
import { ImportDataCommand } from './import-data.command';
import { ConsoleModule } from 'nestjs-console';

@Module({
  imports: [TypeOrmModule.forFeature([Province, District, Ward])],
  providers: [ImportDataService, ImportDataCommand],
  exports: [ImportDataService],
})
export class ImportDataModule {}
