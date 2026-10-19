import { Module } from "@nestjs/common";
import { AuditTrailsModule } from "../audit-trails/audit-trails.module";
import { AppCacheModule } from "../cache/cache.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SocketModule } from "../socket/socket.module";
import { NotificationCampaignsController } from "./campaigns/campaigns.controller";
import { AdminSentNotificationsService } from "./campaigns/services/admin-sent-notifications.service";
import { NotificationCacheService } from "./shared/services/notification-cache.service";
import { FirebasePushService } from "./push/services/firebase-push.service";
import { NotificationsDeliveryService } from "./delivery/services/notifications-delivery.service";
import { NotificationsInternalService } from "./inbox/services/notifications-internal.service";
import { NotificationsInboxController } from "./inbox/inbox.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [PrismaModule, AppCacheModule, SocketModule, AuditTrailsModule],
  controllers: [NotificationsInboxController, NotificationCampaignsController],
  providers: [
    NotificationCacheService,
    FirebasePushService,
    NotificationsInternalService,
    NotificationsDeliveryService,
    NotificationsService,
    AdminSentNotificationsService,
  ],
  exports: [
    NotificationsService,
    FirebasePushService,
    NotificationsInternalService,
    NotificationsDeliveryService,
  ],
})
export class NotificationsModule {}
