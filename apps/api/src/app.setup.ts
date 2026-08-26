import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const defaultCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

type TrustProxyApplication = {
  set(setting: 'trust proxy', value: boolean | number | string): void;
};

function getTrustProxyValue(): boolean | number | string | undefined {
  const rawValue = process.env.TRUST_PROXY?.trim();

  if (!rawValue) {
    return undefined;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  const numericValue = Number(rawValue);

  return Number.isInteger(numericValue) ? numericValue : rawValue;
}

function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? defaultCorsOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function shouldDisableCache(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return true;
  }

  return (
    request.path.startsWith('/auth') || !request.path.startsWith('/public')
  );
}

export function configureApp(app: INestApplication) {
  const trustProxy = getTrustProxyValue();

  if (trustProxy !== undefined) {
    const expressApp = app
      .getHttpAdapter()
      .getInstance() as TrustProxyApplication;
    expressApp.set('trust proxy', trustProxy);
  }

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    if (shouldDisableCache(request)) {
      response.setHeader('Cache-Control', 'no-store, max-age=0');
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
    }

    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
