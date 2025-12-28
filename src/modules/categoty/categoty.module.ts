import { Module } from '@nestjs/common';
import { CategotyService } from './categoty.service';
import { CategotyController } from './categoty.controller';

@Module({
  controllers: [CategotyController],
  providers: [CategotyService],
})
export class CategotyModule {}
