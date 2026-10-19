import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Role } from "@prisma/client";
import { AuditActionsService } from "../audit-trails/recorder/services/audit-actions.service";
import { translate, type Locale } from "../common/i18n";
import type { AdminSentNotificationsQueryDto } from "./campaigns/dto/admin-sent-notifications-query.dto";
import type { CreateNotificationDto } from "./inbox/dto/create-notification.dto";
import type { NotificationsQueryDto } from "./inbox/dto/notifications-query.dto";
import type { UpdateNotificationDto } from "./inbox/dto/update-notification.dto";
import { AdminSentNotificationsService } from "./campaigns/services/admin-sent-notifications.service";
import { NotificationsDeliveryService } from "./delivery/services/notifications-delivery.service";
import { NotificationsInternalService } from "./inbox/services/notifications-internal.service";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly internal: NotificationsInternalService,
    private readonly delivery: NotificationsDeliveryService,
    private readonly auditActions: AuditActionsService,
    private readonly adminSentNotifications: AdminSentNotificationsService,
  ) {}

  async findAll(userId: string, query: NotificationsQueryDto) {
    return this.internal.findAll(userId, query);
  }

  async findOne(id: string, userId: string, locale: Locale) {
    return this.internal.findOne(id, userId, locale);
  }

  async create(userId: string, dto: CreateNotificationDto) {
    const notification = await this.internal.create(userId, dto);
    const metadata = notification.metadata as Record<string, unknown> | null;
    await this.delivery.dispatch([userId], {
      type: dto.type,
      title:
        metadata && typeof metadata.title === "string"
          ? metadata.title
          : undefined,
      message: dto.message,
      metadata: metadata ?? undefined,
      notificationId: notification.id,
    });

    return notification;
  }

  async sendAdminNotificationToUser(
    userId: string,
    title: string,
    message: string,
    actorUserId: string,
    locale: Locale,
  ) {
    const created = await this.internal.createAdminToUser(
      userId,
      message,
      actorUserId,
      title,
    );
    if (!created) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }
    await this.delivery.dispatch([userId], {
      type: NotificationType.ADMIN_BROADCAST,
      title,
      message,
      metadata: created.metadata,
      notificationId: created.notificationId,
    });
    await this.auditActions.adminNotificationSent(actorUserId, userId, {
      target: "user",
      notificationId: created.notificationId,
      title,
      message,
      notificationType: NotificationType.ADMIN_BROADCAST,
    });
    return { recipientCount: 1, notificationId: created.notificationId };
  }

  async sendAdminNotificationToRole(
    role: Role,
    title: string,
    message: string,
    actorUserId: string,
  ) {
    const created = await this.internal.createAdminToRole(
      role,
      message,
      actorUserId,
      title,
    );
    if (created.recipientCount === 0) {
      return { recipientCount: 0 };
    }
    await this.delivery.dispatch(created.userIds, {
      type: NotificationType.ADMIN_BROADCAST,
      title,
      message,
      metadata: created.metadata,
      broadcastId: created.broadcastId,
    });
    await this.auditActions.adminNotificationSent(actorUserId, undefined, {
      target: "role",
      role,
      title,
      message,
      recipientCount: created.recipientCount,
      broadcastId: created.broadcastId,
      notificationType: NotificationType.ADMIN_BROADCAST,
    });
    return {
      recipientCount: created.recipientCount,
      broadcastId: created.broadcastId,
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateNotificationDto,
    locale: Locale,
  ) {
    return this.internal.update(id, userId, dto, locale);
  }

  async markAsRead(id: string, userId: string, locale: Locale) {
    return this.internal.markAsRead(id, userId, locale);
  }

  async markAllAsRead(userId: string) {
    return this.internal.markAllAsRead(userId);
  }

  async listAdminSentNotifications(query: AdminSentNotificationsQueryDto) {
    return this.adminSentNotifications.findAll(query);
  }

  async getAdminSentNotification(campaignId: string, locale: Locale) {
    return this.adminSentNotifications.findOne(campaignId, locale);
  }
}
