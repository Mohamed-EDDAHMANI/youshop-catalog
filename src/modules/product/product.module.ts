import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategoryModule } from '../category/category.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagingModule } from '../../messaging';

@Module({
  imports: [
    CategoryModule,
    PrismaModule,
    MessagingModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
