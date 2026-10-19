import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { NotificationType, Prisma, Role } from "@prisma/client";
import { randomUUID } from "crypto";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  buildNotificationsCacheKey,
  bumpNotificationsCacheGeneration,
} from "../../shared/config/notifications-cache.config";
import type { CreateNotificationDto } from "../dto/create-notification.dto";
import type { NotificationsQueryDto } from "../dto/notifications-query.dto";
import type { UpdateNotificationDto } from "../dto/update-notification.dto";
import {
  normalizeNotificationMetadata,
  withNotificationMetadataTitle,
} from "../utils/notification-metadata.util";
import { NotificationCacheService } from "../../shared/services/notification-cache.service";

export const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  type: true,
  message: true,
  metadata: true,
  isRead: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{
  select: typeof NOTIFICATION_SELECT;
}>;

@Injectable()
export class NotificationsInternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsCache: NotificationCacheService,
  ) {}

  async findAll(userId: string, query: NotificationsQueryDto) {
    const key = buildNotificationsCacheKey("notifications-list", {
      userId,
      page: query.page,
      per_page: query.per_page,
      isRead: query.isRead,
      type: query.type,
    });
    return this.notificationsCache.wrap(key, () =>
      this.computeFindAll(userId, query),
    );
  }

  async findOne(id: string, userId: string, locale: Locale) {
    const key = buildNotificationsCacheKey("notification-detail", {
      id,
      userId,
    });
    return this.notificationsCache.wrap(key, () =>
      this.computeFindOne(id, userId, locale),
    );
  }

  async create(userId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        message: dto.message,
        metadata: withNotificationMetadataTitle(dto.metadata, {
          type: dto.type,
        }) as Prisma.InputJsonValue,
        isRead: dto.isRead ?? false,
        readAt: dto.isRead ? new Date() : null,
      },
      select: NOTIFICATION_SELECT,
    });
    bumpNotificationsCacheGeneration();
    return this.mapNotificationResponse(notification);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateNotificationDto,
    locale: Locale,
  ) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true, type: true },
    });
    if (!existing) {
      throw new NotFoundException(translate(locale, "notificationNotFound"));
    }

    const hasAnyField = Object.values(dto).some((value) => value !== undefined);
    if (!hasAnyField) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "notificationUpdateEmpty")],
          translate(locale, "validationSummary"),
          locale,
        ),
      );
    }

    const data: Prisma.NotificationUpdateInput = {};
    const resolvedType = dto.type ?? existing.type;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.message !== undefined) data.message = dto.message;
    if (dto.metadata !== undefined) {
      data.metadata = withNotificationMetadataTitle(dto.metadata, {
        type: resolvedType,
      }) as Prisma.InputJsonValue;
    }
    if (dto.isRead !== undefined) {
      data.isRead = dto.isRead;
      data.readAt = dto.isRead ? new Date() : null;
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data,
      select: NOTIFICATION_SELECT,
    });
    bumpNotificationsCacheGeneration();
    return this.mapNotificationResponse(notification);
  }

  async markAsRead(id: string, userId: string, locale: Locale) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(translate(locale, "notificationNotFound"));
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      select: NOTIFICATION_SELECT,
    });
    bumpNotificationsCacheGeneration();
    return this.mapNotificationResponse(notification);
  }

  async markAllAsRead(userId: string) {
    const now = new Date();
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: now },
    });
    bumpNotificationsCacheGeneration();
    return { updatedCount: result.count };
  }

  async createAdminToUser(
    userId: string,
    message: string,
    actorUserId: string,
    title?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) return null;

    const metadata = withNotificationMetadataTitle(
      { source: "admin_broadcast", actorUserId },
      { type: NotificationType.ADMIN_BROADCAST, title },
    );
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.ADMIN_BROADCAST,
        message,
        metadata: metadata as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    bumpNotificationsCacheGeneration();
    return {
      notificationId: notification.id,
      metadata,
    };
  }

  async createAdminToRole(
    role: Role,
    message: string,
    actorUserId: string,
    title: string | undefined,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        role,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return { userIds, recipientCount: 0 };
    }

    const broadcastId = randomUUID();
    const metadata = withNotificationMetadataTitle(
      {
        source: "admin_broadcast",
        actorUserId,
        broadcastId,
        role,
      },
      { type: NotificationType.ADMIN_BROADCAST, title },
    );
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: NotificationType.ADMIN_BROADCAST,
        message,
        metadata: metadata as Prisma.InputJsonValue,
      })),
    });
    bumpNotificationsCacheGeneration();
    return {
      userIds,
      recipientCount: userIds.length,
      broadcastId,
      metadata,
    };
  }

  private mapNotificationResponse(
    notification: NotificationRow,
  ): NotificationRow {
    return {
      ...notification,
      metadata: normalizeNotificationMetadata(
        notification.metadata,
        notification.type,
      ),
    };
  }

  private async computeFindAll(userId: string, query: NotificationsQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.type) where.type = query.type;

    const totalItems = await this.prisma.notification.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const [count, data] = await Promise.all([
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.notification.findMany({
        where,
        select: NOTIFICATION_SELECT,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: perPage,
      }),
    ]);

    return {
      data: data.map((row) => this.mapNotificationResponse(row)),
      count,
      pagination: {
        current_page: safePage,
        total_pages: totalPages,
        per_page: perPage,
        total_items: totalItems,
      },
    };
  }

  private async computeFindOne(id: string, userId: string, locale: Locale) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: NOTIFICATION_SELECT,
    });
    if (!notification) {
      throw new NotFoundException(translate(locale, "notificationNotFound"));
    }
    return this.mapNotificationResponse(notification);
  }
}
