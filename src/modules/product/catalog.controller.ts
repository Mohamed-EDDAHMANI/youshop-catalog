import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CatalogService } from './catalog.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @MessagePattern('createCatalog')
  create(@Payload() createCatalogDto: CreateCatalogDto) {
    return this.catalogService.create(createCatalogDto);
  }

  @MessagePattern('findAllCatalog')
  findAll() {
    return this.catalogService.findAll();
  }

  @MessagePattern('findOneCatalog')
  findOne(@Payload() id: number) {
    return this.catalogService.findOne(id);
  }

  @MessagePattern('updateCatalog')
  update(@Payload() updateCatalogDto: UpdateCatalogDto) {
    return this.catalogService.update(updateCatalogDto.id, updateCatalogDto);
  }

  @MessagePattern('removeCatalog')
  remove(@Payload() id: number) {
    return this.catalogService.remove(id);
  }
}
