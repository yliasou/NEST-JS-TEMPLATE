import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AnalyticsEventsController } from "./analytics-events/analytics-events.controller";
import { AuditLogsController } from "./audit-logs/audit-logs.controller";
import { EmailLogsController } from "./email-logs/email-logs.controller";
import { AuditTrailsService } from "./audit-trails.service";
import { AuditContextMiddleware } from "./recorder/context/audit-request-context";
import { AuditActionsService } from "./recorder/services/audit-actions.service";
import { AnalyticsEventsService } from "./analytics-events/services/analytics-events.service";
import { AuditLogsService } from "./audit-logs/services/audit-logs.service";
import { AuditTrailRecorderService } from "./recorder/services/audit-trail-recorder.service";
import { EmailLogsService } from "./email-logs/services/email-logs.service";

@Module({
  imports: [PrismaModule],
  controllers: [
    AuditLogsController,
    EmailLogsController,
    AnalyticsEventsController,
  ],
  providers: [
    AuditTrailsService,
    AuditLogsService,
    EmailLogsService,
    AnalyticsEventsService,
    AuditTrailRecorderService,
    AuditActionsService,
  ],
  exports: [AuditTrailsService, AuditActionsService],
})
export class AuditTrailsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditContextMiddleware)
      .forRoutes({ path: "{*splat}", method: RequestMethod.ALL });
  }
}
