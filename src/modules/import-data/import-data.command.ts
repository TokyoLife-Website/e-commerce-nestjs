import { Console, Command } from 'nestjs-console';
import { ImportDataService } from './import-data.service';
import { ProductsService } from '../products/products.service';
import { Inject } from '@nestjs/common';

@Console()
export class ImportDataCommand {
  constructor(
    private readonly importDataService: ImportDataService,
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}
  @Command({
    command: 'import-data',
    description: 'Import address data from excel files to database',
  })
  async importProvince(): Promise<void> {
    await this.importDataService.importProvinces();
    await this.importDataService.importDistricts();
    await this.importDataService.importWards();
    console.log('Address data imported successfully!');
  }

  @Command({
    command: 'update-final-price',
    description: 'Update finalPrice for all products',
  })
  async updateFinalPriceForAllProducts(): Promise<void> {
    const products = await this.productsService['productRepository'].find();
    for (const product of products) {
      if (typeof product.calculateFinalPrice === 'function') {
        product.calculateFinalPrice();
      }
    }
    await this.productsService['productRepository'].save(products);
    console.log('Updated finalPrice for all products!');
  }

  @Command({
    command: 'orders-address-from-default',
    description: "Update orders.address from user's default address",
  })
  async updateOrdersAddressFromUserDefault(): Promise<void> {
    await this.importDataService.updateOrdersAddressFromUserDefault();
    console.log('Updated orders.address from default user address!');
  }
}
