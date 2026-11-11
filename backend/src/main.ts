import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DasselSandals-Backend');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilitar CORS para que el frontend en React (Vite) pueda comunicarse sin problemas
  app.enableCors({
    origin: true,
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

  // Servir interfaz web de React compilada
  const candidatePaths = [
    path.join(__dirname, '..', 'client'),
    path.join(process.cwd(), 'client'),
    path.join(__dirname, '..', 'public'),
    path.join(process.cwd(), 'public'),
    path.join(__dirname, '..', '..', 'dist'),
    path.join(process.cwd(), '..', 'dist'),
    path.join(process.cwd(), 'dist'),
  ];

  const clientDir = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

  if (clientDir) {
    logger.log(`Sirviendo interfaz web de React desde: ${clientDir}`);
    app.use(express.static(clientDir));

    // Redirección SPA: Cualquier ruta que no sea /api/* devuelve index.html
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(clientDir, 'index.html'));
      }
      next();
    });
  } else {
    logger.warn('No se detecto la carpeta del cliente (index.html). Solo se servira la API.');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`  DASSEL SANDALS BACKEND (NestJS + Prisma + PostgreSQL)`);
  logger.log(`  Servidor corriendo en: http://localhost:${port}`);
  logger.log(`  Interfaz Web: http://localhost:${port}`);
  logger.log(`  API Endpoints: http://localhost:${port}/api`);
  logger.log(`=======================================================`);
}
void bootstrap();
