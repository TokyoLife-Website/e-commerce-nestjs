import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: TreeRepository<Category>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const newCategory = this.categoryRepository.create(createCategoryDto);
    if (createCategoryDto.parentSlug) {
      const parent = await this.findOne(createCategoryDto.parentSlug);
      newCategory.parent = parent;
    }
    return await this.categoryRepository.save(newCategory);
  }

  async findAll() {
    return await this.categoryRepository.findTrees();
  }

  async findOne(slug: string) {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (!category) {
      throw new NotFoundException('Parent category not found!');
    }
    return category;
  }

  async findAllByParentSlug(slug: string) {
    const parentCategory = await this.findOne(slug);
    return await this.categoryRepository.findDescendantsTree(parentCategory);
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
