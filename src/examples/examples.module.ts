import { Module } from "@nestjs/common";
import { AuditTrailsModule } from "../audit-trails/audit-trails.module";
import { AppCacheModule } from "../cache/cache.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ExamplesController } from "./examples.controller";
import { ExamplesService } from "./examples.service";
import { ExampleCreatedProcessor } from "./jobs/example-created.processor";
import { ExampleCreatedQueue } from "./jobs/example-created.queue";
import { ExampleCreatedWorker } from "./jobs/example-created.worker";
import { ExamplesCleanupCron } from "./jobs/examples-cleanup.cron";
import { ExamplesCacheService } from "./services/examples-cache.service";
import { ExamplesReadService } from "./services/examples-read.service";
import { ExamplesValidationService } from "./services/examples-validation.service";
import { ExamplesWriteService } from "./services/examples-write.service";

/**
 * Module d'exemple : illustre la convention (CRUD admin, cache, audit, permissions, queue, cron).
 * Le dupliquer pour démarrer un domaine, puis le supprimer avec `prisma/models/example.prisma`.
 */
@Module({
  imports: [
    PrismaModule,
    AppCacheModule,
    AuditTrailsModule,
    NotificationsModule,
  ],
  controllers: [ExamplesController],
  providers: [
    ExamplesCacheService,
    ExamplesValidationService,
    ExamplesReadService,
    ExamplesWriteService,
    ExamplesService,
    ExampleCreatedProcessor,
    ExampleCreatedQueue,
    ExampleCreatedWorker,
    ExamplesCleanupCron,
  ],
})
export class ExamplesModule {}
