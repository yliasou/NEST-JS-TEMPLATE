import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { SocketGateway } from "../../../socket/socket.gateway";
import { FirebasePushService } from "../../push/services/firebase-push.service";

@Injectable()
export class NotificationsDeliveryService {
  constructor(
    private readonly firebasePush: FirebasePushService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async dispatch(
    userIds: string[],
    payload: {
      type: NotificationType;
      title?: string;
      message: string;
      metadata?: Record<string, unknown>;
      notificationId?: string;
      broadcastId?: string;
    },
  ) {
    const pushData: Record<string, string> = {
      type: payload.type,
    };
    if (payload.title) {
      pushData.title = payload.title;
    }
    if (payload.notificationId) {
      pushData.notificationId = payload.notificationId;
    }
    if (payload.broadcastId) {
      pushData.broadcastId = payload.broadcastId;
    }
    if (payload.metadata !== undefined) {
      pushData.metadata = JSON.stringify(payload.metadata);
    }

    await this.firebasePush.sendForUsers(userIds, {
      title: payload.title,
      body: payload.message,
      data: pushData,
    });

    this.socketGateway.emitNotificationToUsers(userIds, {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata ?? null,
    });
  }
}
