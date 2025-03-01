import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AddressesModule } from '../addresses/addresses.module';
import { UploadModule } from '../upload/upload.module';
import { Image } from '../upload/entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Image]),
    AddressesModule,
    UploadModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
