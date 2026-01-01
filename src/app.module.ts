import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './services/redis.service';
import { WinstonModule } from 'nest-winston';
import { ConfigModule } from '@nestjs/config';
import { winstonConfig } from './common/logger/logger.config';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    ProductModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule {}
