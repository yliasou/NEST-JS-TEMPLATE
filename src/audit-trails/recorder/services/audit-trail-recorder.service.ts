import { Injectable, Logger } from "@nestjs/common";
import { AuditAction, AuditEntity, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { getAuditRequestContext } from "../context/audit-request-context";
import type {
  AuditHttpContext,
  RecordAuditActionInput,
  ResolvedAudit,
} from "../../shared/audit-trails.types";
import { AnalyticsEventsService } from "../../analytics-events/services/analytics-events.service";

@Injectable()
export class AuditTrailRecorderService {
  private readonly logger = new Logger(AuditTrailRecorderService.name);
  private readonly mutatingMethods = new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsEventsService: AnalyticsEventsService,
  ) {}

  async recordAction(input: RecordAuditActionInput) {
    try {
      const ctx = getAuditRequestContext();

      await this.prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          targetUserId: input.targetUserId,
          requestId: input.requestId ?? ctx?.requestId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          metadata: input.metadata ?? undefined,
          ip: input.ip ?? ctx?.ip,
          latitude: input.latitude ?? ctx?.latitude,
          longitude: input.longitude ?? ctx?.longitude,
          locationAccuracy: input.locationAccuracy ?? ctx?.locationAccuracy,
          locationCapturedAt:
            input.locationCapturedAt ?? ctx?.locationCapturedAt,
          userAgent: input.userAgent ?? ctx?.userAgent,
        },
      });

      await this.analyticsEventsService.track({
        userId: input.actorUserId,
        name: `audit.${input.action.toLowerCase()}`,
        properties: {
          action: input.action,
          entity: input.entity ?? null,
          entityId: input.entityId ?? null,
          ...(typeof input.metadata === "object" && input.metadata !== null
            ? { metadata: input.metadata }
            : {}),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist explicit audit action: ${(error as Error).message}`,
      );
    }
  }

  async trackModuleActivity(input: {
    actorUserId?: string;
    name: string;
    properties?: Prisma.InputJsonValue;
  }) {
    try {
      await this.analyticsEventsService.track({
        userId: input.actorUserId,
        name: input.name,
        properties: input.properties,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist module analytics event: ${(error as Error).message}`,
      );
    }
  }

  async recordHttpTrail(input: AuditHttpContext) {
    try {
      const normalizedPath = this.normalizePath(input.path);
      const method = input.method.toUpperCase();

      if (!this.mutatingMethods.has(method)) return;
      if (normalizedPath.startsWith("/notifications")) return;
      if (normalizedPath.startsWith("/docs") || normalizedPath === "/") return;
      if (input.statusCode >= 400) return;

      const resolved = this.resolveAuditAction(method, normalizedPath, input);
      if (!resolved) return;

      await this.prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          targetUserId: resolved.targetUserId,
          requestId: input.requestId,
          action: resolved.action,
          entity: resolved.entity,
          entityId: resolved.entityId,
          metadata: {
            method,
            path: normalizedPath,
            statusCode: input.statusCode,
          },
          ip: input.ip,
          latitude: input.latitude,
          longitude: input.longitude,
          locationAccuracy: input.locationAccuracy,
          locationCapturedAt: input.locationCapturedAt,
          userAgent: input.userAgent,
        },
      });

      await this.analyticsEventsService.track({
        userId: input.actorUserId,
        name: `audit.${resolved.action.toLowerCase()}`,
        properties: {
          action: resolved.action,
          entity: resolved.entity ?? null,
          entityId: resolved.entityId ?? null,
          path: normalizedPath,
          method,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist audit trail: ${(error as Error).message}`,
      );
    }
  }

  private normalizePath(path: string): string {
    const raw = path.split("?")[0] ?? path;
    return raw.startsWith("/api/v1") ? raw.slice("/api/v1".length) || "/" : raw;
  }

  private resolveAuditAction(
    method: string,
    path: string,
    input: AuditHttpContext,
  ): ResolvedAudit | null {
    const body = input.body ?? {};
    const idParam = input.params?.id;

    // Auth et profil : tracés explicitement par les services (AuditActionsService).
    if (method === "PATCH" && path.startsWith("/admin/users/")) {
      if (typeof body.role === "string") {
        return {
          action: AuditAction.ADMIN_ROLE_CHANGE,
          entity: AuditEntity.USER,
          entityId: idParam,
          targetUserId: idParam,
        };
      }
      if (body.isActive === false) {
        return {
          action: AuditAction.ADMIN_USER_SUSPEND,
          entity: AuditEntity.USER,
          entityId: idParam,
          targetUserId: idParam,
        };
      }
      if (body.isActive === true) {
        return {
          action: AuditAction.ADMIN_USER_RESTORE,
          entity: AuditEntity.USER,
          entityId: idParam,
          targetUserId: idParam,
        };
      }
    }

    return null;
  }
}
