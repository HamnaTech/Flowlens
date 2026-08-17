import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

import { PrismaModule } from './prisma/prisma.module';
import { RedisCacheModule } from './cache/redis-cache.module';
import { LoggerModule } from './logger/logger.module';

import { QueueModule } from './modules/jobs/queue.module';
import { StorageModule } from './storage/storage.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TeamsModule } from './modules/teams/teams.module';
import { FrustrationLogsModule } from './modules/frustration-logs/frustration-logs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { OrgRolesGuard } from './common/guards/org-roles.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    // ------------------------------------------------------------------
    // Config — MUST be first and MUST be .forRoot(), not a bare import.
    // Every module in this tree calls ConfigService.get(...) assuming
    // config has already been loaded + validated; without this, those
    // calls would silently return undefined rather than throwing, which
    // is a much worse failure mode (e.g. JWT secret becomes `undefined`
    // instead of the app refusing to boot).
    // ------------------------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { abortEarly: false }, // report every invalid/missing var at once, not just the first
    }),

    // ------------------------------------------------------------------
    // Rate limiting — registered here because this is the correct module-
    // level home for it; main.ts has no mechanism to add a Nest module
    // import after the fact. Without this, every @Throttle() decorator
    // already on AuthController does nothing.
    // ------------------------------------------------------------------
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttlSeconds')! * 1000,
            limit: config.get<number>('throttle.limit')!,
          },
        ],
      }),
    }),

    // ------------------------------------------------------------------
    // Cross-cutting infrastructure (each @Global — imported once here,
    // injectable everywhere without re-importing per feature module)
    // ------------------------------------------------------------------
    PrismaModule,
    RedisCacheModule,
    LoggerModule,

    // ------------------------------------------------------------------
    // Jobs/BullMQ — owns BullModule.forRootAsync (the Redis connection
    // factory) and all 4 @Processor consumers. FrustrationLogsModule and
    // HealthModule separately call BullModule.registerQueue(...) for
    // specific queue names to get an injectable *producer* handle — that
    // does not create duplicate processors or a second Redis connection,
    // it resolves to the same queue instance within this one application
    // context. Confirmed no circular imports: QueueModule only depends on
    // Prisma/AI/Notifications/Storage, never on FrustrationLogsModule.
    // ------------------------------------------------------------------
    QueueModule,

    StorageModule,
    AiModule,
    NotificationsModule,

    // ------------------------------------------------------------------
    // Feature modules
    // ------------------------------------------------------------------
    AuthModule,
    UsersModule,
    OrganizationsModule,
    TeamsModule,
    FrustrationLogsModule,
    CategoriesModule,
    ReportsModule,
    HealthModule,
  ],
  providers: [
    // --------------------------------------------------------------
    // Global guards, executed in array order for every request. All
    // three must return true for a request to proceed.
    //
    // 1. ThrottlerGuard   — cheapest check, rejects abuse before any
    //                       auth/DB work happens.
    // 2. JwtAuthGuard     — populates request.user; short-circuits via
    //                       @Public() for register/login/refresh/health.
    // 3. RolesGuard       — no-ops instantly if a route has no @Roles()
    //                       metadata (see RolesGuard implementation),
    //                       so this is safe to run globally rather than
    //                       requiring @UseGuards(RolesGuard) on every
    //                       admin route individually.
    // 4. OrgRolesGuard    — same no-op-if-no-metadata behavior for
    //                       @OrgRoles(); depends on request.user already
    //                       being set, hence it runs after JwtAuthGuard.
    //
    // NOTE: several already-completed controllers (UsersController,
    // OrganizationsController, TeamsController, OrgFrustrationLogsController,
    // OrgCategoriesController) still carry an explicit
    // @UseGuards(RolesGuard) / @UseGuards(OrgRolesGuard) on top of this.
    // That is redundant now but NOT broken — Nest simply runs the guard
    // twice with identical results. Left as-is per "do not modify
    // unrelated modules" for this turn; safe to clean up in a later pass.
    // --------------------------------------------------------------
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: OrgRolesGuard },

    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // Logging first (outermost — captures full request/response timing),
    // then Transform (innermost — shapes the successful payload just
    // before it leaves the interceptor chain).
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Must run before nestjs-pino's own request middleware (registered by
    // LoggerModule) so that pino's `genReqId: (req) => req.id` — already
    // configured in src/logger/logger.module.ts — has a value to read.
    // Applied here rather than via app.use() in main.ts because Nest
    // resolves module-level middleware during application init, before
    // main.ts ever gets a handle on the created app instance.
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
