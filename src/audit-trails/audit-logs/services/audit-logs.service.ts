import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import type { AuditLogsQueryDto } from "../dto/audit-logs-query.dto";

const auditUserSelect = {
  id: true,
  email: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const;

type AuditUserRow = Prisma.UserGetPayload<{ select: typeof auditUserSelect }>;

const AUDIT_EXPORT_MAX_ROWS = 5000;

function mapAuditLogUser(user: AuditUserRow | null) {
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.profile?.firstName ?? null,
    lastName: user.profile?.lastName ?? null,
    email: user.email ?? null,
  };
}

function buildUserSearchFilter(search: string): Prisma.UserWhereInput {
  return {
    OR: [
      { email: { contains: search, mode: "insensitive" } },
      {
        profile: {
          is: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

function startOfDayUtc(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid startDate: ${value}`);
  }
  if (value.length <= 10) {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }
  return date;
}

function endOfDayUtc(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid endDate: ${value}`);
  }
  if (value.length <= 10) {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }
  return date;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "string"
      ? value
      : value instanceof Date
        ? value.toISOString()
        : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatUserLabel(
  user: ReturnType<typeof mapAuditLogUser>,
  fallbackId?: string | null,
): string {
  if (user) {
    const name = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (name && user.email) return `${name} <${user.email}>`;
    if (name) return name;
    if (user.email) return user.email;
    if (user.id) return user.id;
  }
  return fallbackId || "";
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: AuditLogsQueryDto): Prisma.AuditLogWhereInput {
    const filters: Prisma.AuditLogWhereInput[] = [];
    if (query.action) filters.push({ action: query.action });
    if (query.entity) filters.push({ entity: query.entity });
    if (query.actorUserId) filters.push({ actorUserId: query.actorUserId });
    if (query.targetUserId) filters.push({ targetUserId: query.targetUserId });

    if (query.search) {
      const userSearch = buildUserSearchFilter(query.search);
      filters.push({
        OR: [
          { actorUser: { is: userSearch } },
          { targetUser: { is: userSearch } },
        ],
      });
    }

    const createdAt: Prisma.DateTimeFilter = {};
    if (query.startDate) {
      createdAt.gte = startOfDayUtc(query.startDate);
    }
    if (query.endDate) {
      createdAt.lte = endOfDayUtc(query.endDate);
    }
    if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
      throw new BadRequestException(
        "La date de début ne peut pas être postérieure à la date de fin.",
      );
    }
    if (createdAt.gte || createdAt.lte) {
      filters.push({ createdAt });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private mapRow(
    row: Prisma.AuditLogGetPayload<{
      select: {
        id: true;
        actorUserId: true;
        targetUserId: true;
        requestId: true;
        action: true;
        entity: true;
        entityId: true;
        metadata: true;
        ip: true;
        latitude: true;
        longitude: true;
        locationAccuracy: true;
        locationCapturedAt: true;
        userAgent: true;
        createdAt: true;
        actorUser: { select: typeof auditUserSelect };
        targetUser: { select: typeof auditUserSelect };
      };
    }>,
  ) {
    return {
      id: row.id,
      actorUserId: row.actorUserId,
      targetUserId: row.targetUserId,
      actor: mapAuditLogUser(row.actorUser),
      target: mapAuditLogUser(row.targetUser),
      requestId: row.requestId,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : null,
      ip: row.ip,
      latitude: row.latitude,
      longitude: row.longitude,
      locationAccuracy: row.locationAccuracy,
      locationCapturedAt: row.locationCapturedAt,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    };
  }

  async list(query: AuditLogsQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;
    const where = this.buildWhere(query);

    const totalItems = await this.prisma.auditLog.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: perPage,
      select: {
        id: true,
        actorUserId: true,
        targetUserId: true,
        requestId: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        ip: true,
        latitude: true,
        longitude: true,
        locationAccuracy: true,
        locationCapturedAt: true,
        userAgent: true,
        createdAt: true,
        actorUser: { select: auditUserSelect },
        targetUser: { select: auditUserSelect },
      },
    });

    return {
      data: rows.map((row) => this.mapRow(row)),
      pagination: {
        current_page: safePage,
        total_pages: totalPages,
        per_page: perPage,
        total_items: totalItems,
      },
    };
  }

  async exportCsv(query: AuditLogsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: AUDIT_EXPORT_MAX_ROWS,
      select: {
        id: true,
        actorUserId: true,
        targetUserId: true,
        requestId: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        ip: true,
        latitude: true,
        longitude: true,
        locationAccuracy: true,
        locationCapturedAt: true,
        userAgent: true,
        createdAt: true,
        actorUser: { select: auditUserSelect },
        targetUser: { select: auditUserSelect },
      },
    });

    const header = [
      "date",
      "action",
      "entity",
      "entityId",
      "actor",
      "actorUserId",
      "target",
      "targetUserId",
      "ip",
      "requestId",
      "metadata",
    ];

    const lines = rows.map((row) => {
      const mapped = this.mapRow(row);
      const safeMetadata = this.sanitizeMetadataForExport(mapped.metadata);
      return [
        escapeCsv(mapped.createdAt),
        escapeCsv(mapped.action),
        escapeCsv(mapped.entity),
        escapeCsv(mapped.entityId),
        escapeCsv(formatUserLabel(mapped.actor, mapped.actorUserId)),
        escapeCsv(mapped.actorUserId),
        escapeCsv(formatUserLabel(mapped.target, mapped.targetUserId)),
        escapeCsv(mapped.targetUserId),
        escapeCsv(mapped.ip),
        escapeCsv(mapped.requestId),
        escapeCsv(safeMetadata),
      ].join(",");
    });

    return `\uFEFF${[header.join(","), ...lines].join("\n")}`;
  }

  private sanitizeMetadataForExport(
    metadata: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!metadata || typeof metadata !== "object") return null;
    const sensitive = /password|passwd|pin|secret|token|hash|otp|credential/i;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (sensitive.test(key)) continue;
      out[key] = value;
    }
    return out;
  }
}
