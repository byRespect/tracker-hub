import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { loadAppConfig } from './config/app.config';

async function bootstrap() {
  const config = loadAppConfig();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // CORS yapılandırması - Production'da CORS_ORIGIN env variable kullanılmalı
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  await app.register(cors, {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
    ],
  });

  await app.register(helmet);

  await app.listen(config.port, config.host);
}
bootstrap();
