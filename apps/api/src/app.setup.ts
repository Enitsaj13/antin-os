import { INestApplication, ValidationPipe } from '@nestjs/common';

const defaultCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function getCorsOrigins() {
  return (process.env.CORS_ORIGIN ?? defaultCorsOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: getCorsOrigins(),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
