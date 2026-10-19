import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction, NotificationType, Prisma, Role } from "@prisma/client";
import { buildPaginationQuery } from "../../../common/utils/pagination.util";
import type { Locale } from "../../../common/i18n";
import { translate } from "../../../common/i18n";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  AdminNotificationSendTarget,
  type AdminSentNotificationsQueryDto,
} from "../dto/admin-sent-notifications-query.dto";

type AuditMeta = {
  target?: string;
  title?: string;
  message?: string;
  broadcastId?: string;
  notificationId?: string;
  role?: Role;
  recipientCount?: number;
};

type UserLite = {
  id: string;
  email: string | null;
  profile: { firstName: string; lastName: string } | null;
};

type AuditLogRow = {
  id: string;
  createdAt: Date;
  targetUserId: string | null;
  metadata: Prisma.JsonValue;
  actorUser: UserLite | null;
  targetUser: UserLite | null;
};

const ACTOR_SELECT = {
  id: true,
  email: true,
  profile: { select: { firstName: true, lastName: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminSentNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminSentNotificationsQueryDto) {
    const where = this.buildWhere(query);

    if (query.search) {
      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
        include: {
          actorUser: { select: ACTOR_SELECT },
          targetUser: { select: ACTOR_SELECT },
        },
      });
      const s = query.search.toLowerCase();
      const allItems = (
        await Promise.all(logs.map((log) => this.mapAuditLogToItem(log)))
      ).filter(
        (item) =>
          item.message.toLowerCase().includes(s) ||
          (item.title?.toLowerCase().includes(s) ?? false),
      );
      const { skip, perPage, pagination } = buildPaginationQuery(
        allItems.length,
        query.page,
        query.per_page,
      );
      return { data: allItems.slice(skip, skip + perPage), pagination };
    }

    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;

    const totalItems = await this.prisma.auditLog.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: perPage,
      include: {
        actorUser: { select: ACTOR_SELECT },
        targetUser: { select: ACTOR_SELECT },
      },
    });

    const items = await Promise.all(
      logs.map((log) => this.mapAuditLogToItem(log)),
    );

    return {
      data: items,
      pagination: {
        current_page: safePage,
        total_pages: totalPages,
        per_page: perPage,
        total_items: totalItems,
      },
    };
  }

  async findOne(campaignId: string, locale: Locale) {
    const log = await this.findAuditLogByCampaignId(campaignId);
    if (!log) {
      throw new NotFoundException(
        translate(locale, "adminSentNotificationNotFound"),
      );
    }
    return this.mapAuditLogToItem(log);
  }

  private buildWhere(
    query: AdminSentNotificationsQueryDto,
  ): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {
      action: AuditAction.ADMIN_NOTIFICATION_SEND,
    };

    if (query.actorUserId) {
      where.actorUserId = query.actorUserId;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    if (query.target) {
      where.metadata = { path: ["target"], equals: query.target };
    }

    if (query.role) {
      where.metadata = { path: ["role"], equals: query.role };
    }

    return where;
  }

  private async findAuditLogByCampaignId(
    campaignId: string,
  ): Promise<AuditLogRow | null> {
    const byBroadcast = await this.prisma.auditLog.findFirst({
      where: {
        action: AuditAction.ADMIN_NOTIFICATION_SEND,
        metadata: { path: ["broadcastId"], equals: campaignId },
      },
      orderBy: { createdAt: "desc" },
      include: {
        actorUser: { select: ACTOR_SELECT },
        targetUser: { select: ACTOR_SELECT },
      },
    });
    if (byBroadcast) return byBroadcast;

    const byNotification = await this.prisma.auditLog.findFirst({
      where: {
        action: AuditAction.ADMIN_NOTIFICATION_SEND,
        metadata: { path: ["notificationId"], equals: campaignId },
      },
      orderBy: { createdAt: "desc" },
      include: {
        actorUser: { select: ACTOR_SELECT },
        targetUser: { select: ACTOR_SELECT },
      },
    });
    if (byNotification) return byNotification;

    return this.prisma.auditLog.findFirst({
      where: { id: campaignId, action: AuditAction.ADMIN_NOTIFICATION_SEND },
      include: {
        actorUser: { select: ACTOR_SELECT },
        targetUser: { select: ACTOR_SELECT },
      },
    });
  }

  private async mapAuditLogToItem(log: AuditLogRow) {
    const meta = (log.metadata ?? {}) as AuditMeta;
    const campaignId = meta.broadcastId ?? meta.notificationId ?? log.id;
    const target = this.resolveTarget(meta);

    const content = await this.resolveContent(meta);
    const readStats = await this.resolveReadStats(meta);

    const recipientCount =
      meta.recipientCount ??
      readStats.totalCount ??
      (target === AdminNotificationSendTarget.USER ? 1 : 0);

    return {
      id: campaignId,
      auditLogId: log.id,
      title: content.title,
      message: content.message,
      target,
      targetUserId: log.targetUserId,
      targetUser: log.targetUser ? this.mapUserLite(log.targetUser) : null,
      targetRole: meta.role ?? null,
      recipientCount,
      readCount: readStats.readCount,
      unreadCount: readStats.unreadCount,
      sentAt: log.createdAt,
      sentBy: log.actorUser ? this.mapUserLite(log.actorUser) : null,
    };
  }

  private resolveTarget(meta: AuditMeta): AdminNotificationSendTarget {
    if (meta.target === AdminNotificationSendTarget.ROLE || meta.role) {
      return AdminNotificationSendTarget.ROLE;
    }
    return AdminNotificationSendTarget.USER;
  }

  private mapUserLite(user: UserLite) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
    };
  }

  private async resolveContent(meta: AuditMeta): Promise<{
    title: string | null;
    message: string;
  }> {
    if (meta.message) {
      return { title: meta.title ?? null, message: meta.message };
    }

    const notification = await this.findSampleNotification(meta);
    if (!notification) {
      return { title: meta.title ?? null, message: "" };
    }

    const nMeta = (notification.metadata ?? {}) as { title?: string };
    return {
      title: meta.title ?? nMeta.title ?? null,
      message: notification.message,
    };
  }

  private async findSampleNotification(meta: AuditMeta) {
    if (meta.notificationId) {
      return this.prisma.notification.findUnique({
        where: { id: meta.notificationId },
        select: { message: true, metadata: true },
      });
    }

    if (meta.broadcastId) {
      return this.prisma.notification.findFirst({
        where: {
          type: NotificationType.ADMIN_BROADCAST,
          metadata: { path: ["broadcastId"], equals: meta.broadcastId },
        },
        select: { message: true, metadata: true },
      });
    }

    return null;
  }

  private async resolveReadStats(meta: AuditMeta) {
    if (meta.broadcastId) {
      const baseWhere: Prisma.NotificationWhereInput = {
        type: NotificationType.ADMIN_BROADCAST,
        metadata: { path: ["broadcastId"], equals: meta.broadcastId },
      };
      const [totalCount, readCount] = await Promise.all([
        this.prisma.notification.count({ where: baseWhere }),
        this.prisma.notification.count({
          where: { ...baseWhere, isRead: true },
        }),
      ]);
      return {
        totalCount,
        readCount,
        unreadCount: totalCount - readCount,
      };
    }

    if (meta.notificationId) {
      const notification = await this.prisma.notification.findUnique({
        where: { id: meta.notificationId },
        select: { isRead: true },
      });
      const readCount = notification?.isRead ? 1 : 0;
      return { totalCount: 1, readCount, unreadCount: 1 - readCount };
    }

    return { totalCount: 0, readCount: 0, unreadCount: 0 };
  }
}
