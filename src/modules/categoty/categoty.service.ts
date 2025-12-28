import { Injectable } from '@nestjs/common';
import { CreateCategotyDto } from './dto/create-categoty.dto';
import { UpdateCategotyDto } from './dto/update-categoty.dto';

@Injectable()
export class CategotyService {
  create(createCategotyDto: CreateCategotyDto) {
    return 'This action adds a new categoty';
  }

  findAll() {
    return `This action returns all categoty`;
  }

  findOne(id: number) {
    return `This action returns a #${id} categoty`;
  }

  update(id: number, updateCategotyDto: UpdateCategotyDto) {
    return `This action updates a #${id} categoty`;
  }

  remove(id: number) {
    return `This action removes a #${id} categoty`;
  }
}
