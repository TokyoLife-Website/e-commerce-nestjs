import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UploadService } from '../upload/upload.service';
import { Pagination as PaginationParamsType } from 'src/common/decorators/pagination-params.decorator';
import { PaginationResource } from 'src/common/types/pagination-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private uploadService: UploadService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, phone } = createUserDto;
    const existingEmail = await this.findOneByEmail(email);
    if (existingEmail) throw new ConflictException('Email already exists!');
    const existingPhone = await this.userRepository.findOneBy({ phone });
    if (existingPhone) throw new ConflictException('Phone already exists!');
    const newUser = this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  async findAll(
    pagination: PaginationParamsType,
  ): Promise<PaginationResource<User>> {
    const { limit, offset, page, size } = pagination;
    const [items, totalItems] = await this.userRepository.findAndCount({
      relations: ['avatar'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    const totalPages = Math.ceil(totalItems / size);
    return { items, page, size, totalItems, totalPages };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['avatar'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found!`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['avatar'],
    });
  }

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    const user = await this.findOne(userId);
    if (user.avatar?.id) await this.uploadService.deleteImage(user.avatar.id);
    const avatar = await this.uploadService.uploadSingleImage(file, 'avatar');
    user.avatar = avatar;
    return await this.save(user);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const existingEmail = await this.findOneByEmail(updateUserDto.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new ConflictException('Email already exists!');
    }
    const existingPhone = await this.userRepository.findOneBy({
      phone: updateUserDto.phone,
    });
    if (existingPhone && existingPhone.id !== id) {
      throw new ConflictException('Phone already exists!');
    }
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found!`);
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid)
      throw new BadRequestException('Current password incorrect');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  async updateStatus(id: number, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return await this.userRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
