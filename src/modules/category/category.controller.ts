import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ServiceError } from '../../common/exceptions';
import { CATALOG_PATTERNS } from '../../messaging';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern(CATALOG_PATTERNS.CATEGORY_CREATE)
  async create(@Payload() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoryService.create(createCategoryDto);
    
    if (result instanceof ServiceError) {
      throw new RpcException(result.toJSON());
    }
    
    return result;
  }

  @MessagePattern(CATALOG_PATTERNS.CATEGORY_FIND_ALL)
  findAll() {
    return this.categoryService.findAll();
  }

  @MessagePattern(CATALOG_PATTERNS.CATEGORY_FIND_ONE)
  findOne(@Payload() id: number) {
    return this.categoryService.findOne(id);
  }

  @MessagePattern(CATALOG_PATTERNS.CATEGORY_UPDATE)
  update(@Payload() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(updateCategoryDto.id, updateCategoryDto);
  }

  @MessagePattern(CATALOG_PATTERNS.CATEGORY_REMOVE)
  remove(@Payload() id: number) {
    return this.categoryService.remove(id);
  }
}
