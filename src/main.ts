import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  // bufferLogs holds any log lines emitted during module initialization
  // until the real pino logger (attached below) is ready, instead of
  // losing them to the default Nest console logger.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // Body size limits are applied manually below via json()/urlencoded(),
    // so Nest's default body parser is disabled here to avoid double
    // parsing / conflicting limits.
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('nodeEnv')!;
  const port = config.get<number>('port')!;
  const apiPrefix = config.get<string>('apiPrefix')!;
  const apiDefaultVersion = config.get<string>('apiDefaultVersion')!;
  const corsOrigins = config.get<string[]>('corsOrigins') ?? [];

  // --------------------------------------------------------------------
  // Logging — reuse the existing Pino setup (src/logger/logger.module.ts)
  // rather than the default Nest logger. Everything logged from this
  // point on (including the "listening on" line at the bottom) goes
  // through pino.
  // --------------------------------------------------------------------
  app.useLogger(app.get(PinoLogger));

  // --------------------------------------------------------------------
  // Security headers
  // --------------------------------------------------------------------
  app.use(
    helmet({
      // This is a pure JSON API, not an HTML-serving app — a strict CSP
      // has no content to protect here and would also break the Swagger
      // UI's inline scripts/styles at /docs. Every other helmet default
      // (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) stays on.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Accurate client IP behind a load balancer/reverse proxy — several
  // already-built features depend on a correct request.ip: login lockout
  // by IP (AuthService), ActivityLog audit entries, and ReqMeta-derived
  // session metadata. Without this, every request behind a proxy would
  // appear to come from the proxy's own address.
  app.set('trust proxy', 1);

  // --------------------------------------------------------------------
  // CORS — environment-aware. In production, only the explicitly
  // configured origins are allowed; an empty CORS_ORIGINS in production
  // means no browser client can reach the API rather than silently
  // falling back to permissive.
  // --------------------------------------------------------------------
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : nodeEnv === 'development' ? true : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  // --------------------------------------------------------------------
  // Body size limits — file uploads (avatars, attachments) go through
  // multer/FileInterceptor separately and are governed by
  // storage.maxUploadSizeMb instead; these limits are for JSON/form
  // payloads only.
  // --------------------------------------------------------------------
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  // --------------------------------------------------------------------
  // API prefix + versioning
  // /health is excluded from the prefix and marked VERSION_NEUTRAL on the
  // controller itself, so it stays at the conventional unprefixed,
  // unversioned path Docker/k8s healthchecks expect.
  // --------------------------------------------------------------------
  app.setGlobalPrefix(apiPrefix, { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: apiDefaultVersion });

  // --------------------------------------------------------------------
  // Validation — global. Every DTO across every already-built module
  // (Create/Update/List DTOs in Auth, Users, Organizations, Teams,
  // FrustrationLogs, Categories) relies on this being registered; none of
  // them work correctly without it.
  // --------------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // reject requests containing undeclared properties instead of silently dropping them
      transform: true, // enables the @Type()-driven query/param coercion already used throughout (pagination, filters)
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // NOTE: Global exception filter, response transform interceptor,
  // logging interceptor, and the JwtAuthGuard/RolesGuard/OrgRolesGuard/
  // ThrottlerGuard chain are already registered as APP_FILTER/
  // APP_INTERCEPTOR/APP_GUARD providers in AppModule — intentionally NOT
  // re-registered here to avoid every request being filtered/intercepted
  // twice.

  // --------------------------------------------------------------------
  // Swagger / OpenAPI
  // --------------------------------------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FlowLens AI API')
    .setDescription(
      'AI-powered productivity friction tracking API. All endpoints except ' +
      'auth/health require a Bearer access token obtained from /auth/login.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('Auth')
    .addTag('Users')
    .addTag('Frustration Logs')
    .addTag('Categories')
    .addTag('AI Reports')
    .addTag('Health')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // Deliberately mounted outside the versioned /api/v1 prefix so the docs
  // URL doesn't change across API versions. Contains no secrets — DTO
  // shapes and route paths only, never .env values or provider keys.
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  // --------------------------------------------------------------------
  // Graceful shutdown — lets PrismaService.onModuleDestroy() and any
  // in-flight BullMQ job cleanup run on SIGTERM/SIGINT instead of the
  // process being killed mid-request during a deploy or container
  // restart.
  // --------------------------------------------------------------------
  app.enableShutdownHooks();

  await app.listen(port);

  const logger = app.get(PinoLogger);
  logger.log(`FlowLens AI API listening on port ${port} [${nodeEnv}]`);
  logger.log(`API base path: /${apiPrefix}/v${apiDefaultVersion}`);
  logger.log(`Swagger docs:  /docs`);
  logger.log(`Health check:  /health`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during application bootstrap:', err);
  process.exit(1);
});
