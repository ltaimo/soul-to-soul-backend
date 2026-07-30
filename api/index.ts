import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let cachedServer: any;

async function bootstrapServer() {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.init();

  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}
