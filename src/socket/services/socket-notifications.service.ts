import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Server, Socket } from "socket.io";
import {
  buildNotificationsUserRoom,
  NOTIFICATIONS_SOCKET_EVENT_NEW,
} from "../../notifications/delivery/constants/notifications-realtime.constants";
import { isSocketLoggingEnabled } from "../config/socket-logs.config";

export interface NotificationRealtimePayload {
  type: string;
  title?: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

@Injectable()
export class SocketNotificationsService {
  private readonly logger = new Logger(SocketNotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  /** Joint la room user:{userId} et retourne le nom de room. */
  joinUserRoom(client: Socket, userId: string): string {
    const room = buildNotificationsUserRoom(userId);
    void client.join(room);
    return room;
  }

  /** Diffuse un event `notifications.new` aux rooms user:{id} concernees. */
  emitNotificationToUsers(
    server: Server,
    userIds: string[],
    payload: NotificationRealtimePayload,
  ) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      if (isSocketLoggingEnabled(this.config)) {
        this.logger.warn(
          `[Socket] emitNotificationToUsers: aucun userId — event ${NOTIFICATIONS_SOCKET_EVENT_NEW} ignore`,
        );
      }
      return;
    }

    const eventPayload = {
      ...payload,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };

    if (isSocketLoggingEnabled(this.config)) {
      this.logger.log(
        `[Socket] emission ${NOTIFICATIONS_SOCKET_EVENT_NEW} type=${payload.type} destinataires=${uniqueIds.length} rooms=${uniqueIds
          .map((id) => buildNotificationsUserRoom(id))
          .join(", ")}`,
      );
    }

    uniqueIds.forEach((userId) => {
      const room = buildNotificationsUserRoom(userId);
      server.to(room).emit(NOTIFICATIONS_SOCKET_EVENT_NEW, eventPayload);
    });
  }
}
