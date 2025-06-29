import {
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CustomHttpExceptionFilter } from './common/filters/custom-http-exception.filter';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ConsoleModule } from 'nestjs-console';
import { ImportDataModule } from './modules/import-data/import-data.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CartModule } from './modules/cart/cart.module';
import { UploadModule } from './modules/upload/upload.module';
import { MulterModule } from './modules/multer/multer.module';
import { ReviewModule } from './modules/review/review.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(__dirname, '../../.env')],
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    AddressesModule,
    ConsoleModule,
    CategoriesModule,
    ImportDataModule,
    ProductsModule,
    WishlistModule,
    CartModule,
    ReviewModule,
    UploadModule,
    MulterModule,
    OrdersModule,
    CouponModule,
    ShippingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: CustomHttpExceptionFilter },
    { provide: APP_PIPE, useClass: CustomValidationPipe },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    JwtStrategy,
  ],
})
export class AppModule {}
