import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  console.log('----------------------------||CATALOG SERVICE RUNNING||---------------------------');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3002,
      },
    },
  );

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  await app.listen();
}
bootstrap();
