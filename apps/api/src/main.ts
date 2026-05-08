import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const port = process.env.PORT ?? '3001';
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`NutriMax API listening on http://localhost:${port}`);
}

void bootstrap();
