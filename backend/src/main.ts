import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DasselSandals-Backend');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que el frontend en React (Vite) pueda comunicarse sin problemas
  app.enableCors({
    origin: true, // permite localhost:5173, localhost:5174, etc.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefijo global para las rutas: /api/...
  app.setGlobalPrefix('api');

  // Validaciones automáticas con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`  DASSEL SANDALS BACKEND (NestJS + Prisma + PostgreSQL)`);
  logger.log(`  Servidor corriendo en: http://localhost:${port}/api`);
  logger.log(`=======================================================`);
}
bootstrap();
