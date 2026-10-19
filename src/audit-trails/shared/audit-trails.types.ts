import type {
  AuditAction,
  AuditEntity,
  EmailLogStatus,
  Prisma,
} from "@prisma/client";

export interface AuditHttpContext {
  method: string;
  path: string;
  statusCode: number;
  actorUserId?: string;
  requestId?: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationCapturedAt?: Date;
  userAgent?: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface ResolvedAudit {
  action: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  targetUserId?: string;
}

export interface RecordAuditActionInput {
  actorUserId?: string;
  targetUserId?: string;
  requestId?: string;
  action: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationCapturedAt?: Date;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface TrackEmailLogInput {
  userId?: string;
  to: string;
  subject: string;
  template: string;
  status?: EmailLogStatus;
  entityType?: string;
  entityId?: string;
  providerId?: string;
  error?: string;
}

export interface TrackAnalyticsEventInput {
  userId?: string;
  sessionId?: string;
  name: string;
  properties?: Prisma.InputJsonValue;
}
