import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategotyService } from './categoty.service';
import { CreateCategotyDto } from './dto/create-categoty.dto';
import { UpdateCategotyDto } from './dto/update-categoty.dto';

@Controller()
export class CategotyController {
  constructor(private readonly categotyService: CategotyService) {}

  @MessagePattern('createCategoty')
  create(@Payload() createCategotyDto: CreateCategotyDto) {
    return this.categotyService.create(createCategotyDto);
  }

  @MessagePattern('findAllCategoty')
  findAll() {
    return this.categotyService.findAll();
  }

  @MessagePattern('findOneCategoty')
  findOne(@Payload() id: number) {
    return this.categotyService.findOne(id);
  }

  @MessagePattern('updateCategoty')
  update(@Payload() updateCategotyDto: UpdateCategotyDto) {
    return this.categotyService.update(updateCategotyDto.id, updateCategotyDto);
  }

  @MessagePattern('removeCategoty')
  remove(@Payload() id: number) {
    return this.categotyService.remove(id);
  }
}
