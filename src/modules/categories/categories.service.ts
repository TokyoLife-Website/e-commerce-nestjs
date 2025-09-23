import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
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
    if (createCategoryDto.parentId) {
      const parent = await this.findOneById(createCategoryDto.parentId);
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

  async findOneById(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found!');
    }
    return category;
  }

  async findAllByParentSlug(slug: string) {
    const parentCategory = await this.findOne(slug);
    return await this.categoryRepository.findDescendantsTree(parentCategory);
  }
}
