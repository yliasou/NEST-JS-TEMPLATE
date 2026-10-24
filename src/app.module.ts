import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import Redis from "ioredis";
import { MobileApiHeadersGuard } from "./common/guards/mobile-api-headers.guard";
import { IpBlockModule } from "./common/ip-block/ip-block.module";
import { MaintenanceMiddleware } from "./common/middleware/maintenance.middleware";
import { VersionCheckMiddleware } from "./common/middleware/version-check.middleware";
import { RedisThrottlerStorage } from "./common/throttler/redis-throttler-storage";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AppCacheModule } from "./cache/cache.module";
import { ProfileModule } from "./profile/profile.module";
import { RedisModule } from "./redis/redis.module";
import { UploadsModule } from "./common/uploads/uploads.module";
import { UserModule } from "./admin/user/user.module";
import { AdminAccessModule } from "./admin/access/access.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AuditTrailsModule } from "./audit-trails/audit-trails.module";
import { AnnoncesModule } from "./annonces/annonces.module";
import { NewsletterModule } from "./newsletter/newsletter.module";
import { EmailingModule } from "./emailing/emailing.module";
import { SocketModule } from "./socket/socket.module";
import { JobsModule } from "./jobs/jobs.module";
import { ExamplesModule } from "./examples/examples.module";
import { perfProfilingEnabled } from "./common/perf/perf-metrics";
import { PerfProfilingService } from "./common/perf/perf-profiling.service";
import { PerfRequestInterceptor } from "./common/perf/perf-request.interceptor";
import { PeopleModule } from "./people/people.module";

const perfProviders = perfProfilingEnabled()
  ? [
      PerfProfilingService,
      { provide: APP_INTERCEPTOR, useClass: PerfRequestInterceptor },
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: validateEnv,
    }),
    IpBlockModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const disabled =
          config.get<string>("THROTTLE_ENABLED", "true") === "false";
        const redisUrl = config.get<string>("REDIS_URL");
        const enableRedisThrottler =
          config.get<string>("THROTTLE_REDIS_ENABLED", "false") === "true";
        const ttlParsed = parseInt(
          config.get<string>("THROTTLE_TTL_MS", "60000"),
          10,
        );
        const ttl =
          Number.isFinite(ttlParsed) && ttlParsed >= 1000 ? ttlParsed : 60_000;
        const limitParsed = parseInt(
          config.get<string>("THROTTLE_LIMIT", "100"),
          10,
        );
        const limit =
          Number.isFinite(limitParsed) && limitParsed >= 1 ? limitParsed : 100;

        const storage =
          enableRedisThrottler && redisUrl
            ? new RedisThrottlerStorage(new Redis(redisUrl))
            : undefined;

        return {
          throttlers: [{ name: "default", ttl, limit }],
          skipIf: (ctx) => {
            if (disabled) return true;
            const req = ctx
              .switchToHttp()
              .getRequest<{ originalUrl?: string; url?: string }>();
            const url = `${req.originalUrl ?? ""}${req.url ?? ""}`;
            if (
              config.get<string>("THROTTLE_SKIP_SWAGGER", "true") === "false"
            ) {
              return false;
            }
            return (
              url.includes("/docs") ||
              url.includes("docs-json") ||
              url.includes("/api/v1/docs")
            );
          },
          ...(storage ? { storage } : {}),
        };
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AppCacheModule,
    RedisModule,
    JobsModule,
    AuthModule,
    ProfileModule,
    UploadsModule,
    UserModule,
    AdminAccessModule,
    AuditTrailsModule,
    NotificationsModule,
    EmailingModule,
    AnnoncesModule,
    NewsletterModule,
    SocketModule,
    ExamplesModule,
    PeopleModule,
  ],
  providers: [
    MaintenanceMiddleware,
    VersionCheckMiddleware, // Doit être dans providers pour que NestJS puisse l'injecter
    { provide: APP_GUARD, useClass: MobileApiHeadersGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ...perfProviders,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Lire la variable d'environnement (0 = false, 1 = true)
    const envValue = process.env.VERSION_CHECK_ENABLED;
    const versionCheckEnabled = envValue === "1" || envValue === "true";

    if (!versionCheckEnabled) {
      consumer
        .apply(MaintenanceMiddleware)
        .forRoutes({ path: "{*splat}", method: RequestMethod.ALL });
      return;
    }

    consumer
      .apply(VersionCheckMiddleware, MaintenanceMiddleware)
      .forRoutes({ path: "{*splat}", method: RequestMethod.ALL });
  }
}
