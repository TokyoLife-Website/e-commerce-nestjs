import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WishList } from './entities/wishlist.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishList)
    private wishlistRepository: Repository<WishList>,
    private usersService: UsersService,
    private productsService: ProductsService,
  ) {}

  async getWishlistByUser(userId: number): Promise<WishList[]> {
    const user = await this.usersService.findOne(userId);
    return await this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });
  }

  async addToWishlist(userId: number, productId: number): Promise<WishList> {
    const user = await this.usersService.findOne(userId);
    const product = await this.productsService.findOneById(productId);
    const existingWishlist = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (existingWishlist) {
      throw new BadRequestException('Product is already in the wishlist');
    }
    const wishlist = this.wishlistRepository.create({ product, user });
    return await this.wishlistRepository.save(wishlist);
  }

  async removeFromWishlist(id: number) {
    const wishlist = await this.wishlistRepository.findOneBy({ id });
    if (!wishlist) throw new NotFoundException('Wishlist item not found');
    await this.wishlistRepository.remove(wishlist);
  }

  async clearWishlist(userId: number) {
    const user = await this.usersService.findOne(userId);
    await this.wishlistRepository.delete({ user: { id: userId } });
  }
}
