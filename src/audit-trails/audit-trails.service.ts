import { Injectable } from "@nestjs/common";
import type { AnalyticsEventsQueryDto } from "./analytics-events/dto/analytics-events-query.dto";
import type { AuditLogsQueryDto } from "./audit-logs/dto/audit-logs-query.dto";
import type { EmailLogsQueryDto } from "./email-logs/dto/email-logs-query.dto";
import type {
  AuditHttpContext,
  RecordAuditActionInput,
  TrackAnalyticsEventInput,
  TrackEmailLogInput,
} from "./shared/audit-trails.types";
import { AnalyticsEventsService } from "./analytics-events/services/analytics-events.service";
import { AuditLogsService } from "./audit-logs/services/audit-logs.service";
import { AuditTrailRecorderService } from "./recorder/services/audit-trail-recorder.service";
import { EmailLogsService } from "./email-logs/services/email-logs.service";

@Injectable()
export class AuditTrailsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly emailLogsService: EmailLogsService,
    private readonly analyticsEventsService: AnalyticsEventsService,
    private readonly auditTrailRecorderService: AuditTrailRecorderService,
  ) {}

  async listAuditLogs(query: AuditLogsQueryDto) {
    return this.auditLogsService.list(query);
  }

  async exportAuditLogsCsv(query: AuditLogsQueryDto) {
    return this.auditLogsService.exportCsv(query);
  }

  async listEmailLogs(query: EmailLogsQueryDto) {
    return this.emailLogsService.list(query);
  }

  async listAnalyticsEvents(query: AnalyticsEventsQueryDto) {
    return this.analyticsEventsService.list(query);
  }

  async trackAnalyticsEvent(input: TrackAnalyticsEventInput) {
    return this.analyticsEventsService.track(input);
  }

  async trackEmailLog(input: TrackEmailLogInput) {
    return this.emailLogsService.track(input);
  }

  async recordAction(input: RecordAuditActionInput) {
    return this.auditTrailRecorderService.recordAction(input);
  }

  async recordHttpTrail(input: AuditHttpContext) {
    return this.auditTrailRecorderService.recordHttpTrail(input);
  }
}
