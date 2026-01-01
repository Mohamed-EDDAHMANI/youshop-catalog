import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern('createCategory')
  create(@Payload() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @MessagePattern('findAllCategory')
  findAll() {
    return this.categoryService.findAll();
  }

  @MessagePattern('findOneCategory')
  findOne(@Payload() id: number) {
    return this.categoryService.findOne(id);
  }

  @MessagePattern('updateCategory')
  update(@Payload() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(updateCategoryDto.id, updateCategoryDto);
  }

  @MessagePattern('removeCategory')
  remove(@Payload() id: number) {
    return this.categoryService.remove(id);
  }
}
