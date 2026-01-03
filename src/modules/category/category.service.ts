import { Injectable, Logger } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceError } from '../../common/exceptions';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      this.logger.log(`Creating category: ${createCategoryDto.name}`);

      const result = await this.prisma.category.create({
        data: createCategoryDto,
      });

      this.logger.log(`Category created successfully: ${result.id}`);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return new ServiceError(
          'CONFLICT',
          `Category with name "${createCategoryDto.name}" already exists`,
          409,
          'catalog-service',
          { field: error.meta?.target },
        );
      }

      this.logger.error(`Failed to create category: ${error.message}`);
      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        'Failed to create category',
        500,
        'catalog-service',
        { originalError: error.code }
      );
    }
  }

  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
