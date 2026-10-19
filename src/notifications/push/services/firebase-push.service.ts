import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  NOTIFICATIONS_PUSH_FCM_BATCH_SIZE,
  resolveNotificationsPushConfig,
} from "../config/notifications-push.config";

export type FirebasePushMessage = {
  title?: string;
  body: string;
  /** Cles et valeurs uniquement string (contrainte FCM `data`). */
  data?: Record<string, string>;
};

@Injectable()
export class FirebasePushService implements OnModuleInit {
  private readonly logger = new Logger(FirebasePushService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const cfg = resolveNotificationsPushConfig((k) =>
      this.config.get<string>(k),
    );

    const partial =
      Boolean(this.config.get<string>("FIREBASE_PROJECT_ID")?.trim()) ||
      Boolean(this.config.get<string>("FIREBASE_CLIENT_EMAIL")?.trim()) ||
      Boolean(this.config.get<string>("FIREBASE_PRIVATE_KEY")?.trim());

    if (!cfg.enabled) {
      if (partial) {
        this.logger.warn(
          "Firebase push desactive : variables FIREBASE_* incompletes ou FIREBASE_PUSH_ENABLED=false.",
        );
      } else {
        this.logger.log(
          "Firebase push desactive (aucune variable FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).",
        );
      }
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: cfg.projectId,
            clientEmail: cfg.clientEmail,
            privateKey: cfg.privateKey,
          }),
        });
      }
      this.messaging = admin.messaging();
      this.logger.log(
        `Firebase Admin initialise pour le projet ${cfg.projectId} (messagerie FCM prete).`,
      );
    } catch (err) {
      this.messaging = null;
      this.logger.error(
        "Echec initialisation Firebase Admin — push desactive pour ce processus.",
        err instanceof Error ? err.stack : err,
      );
    }
  }

  isEnabled(): boolean {
    return this.messaging != null;
  }

  /**
   * Envoie une notification visuelle + donnees aux appareils enregistres des utilisateurs.
   * Ne propage pas les erreurs (log uniquement) pour ne pas bloquer le flux metier.
   */
  async sendForUsers(
    userIds: string[],
    message: FirebasePushMessage,
  ): Promise<void> {
    if (!this.messaging || userIds.length === 0) {
      return;
    }

    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: uniqueUserIds }, isActive: true },
      select: { id: true, userId: true, token: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const latestByUser = new Map<string, string>();
    const staleIds: string[] = [];
    for (const row of tokens) {
      if (!row.token) continue;
      if (latestByUser.has(row.userId)) {
        staleIds.push(row.id);
        continue;
      }
      latestByUser.set(row.userId, row.token);
    }

    if (staleIds.length > 0) {
      await this.prisma.pushToken.updateMany({
        where: { id: { in: staleIds } },
        data: { isActive: false },
      });
      this.logger.log(
        `Push FCM: ${staleIds.length} ancien(s) jeton(s) revoque(s), envoi limite au dernier appareil.`,
      );
    }

    const tokenList = [...latestByUser.values()];
    if (tokenList.length === 0) {
      return;
    }

    const defaultTitle =
      this.config.get<string>("FIREBASE_DEFAULT_NOTIFICATION_TITLE")?.trim() ||
      "Notification";

    const title = message.title || defaultTitle;

    try {
      for (
        let i = 0;
        i < tokenList.length;
        i += NOTIFICATIONS_PUSH_FCM_BATCH_SIZE
      ) {
        const chunk = tokenList.slice(i, i + NOTIFICATIONS_PUSH_FCM_BATCH_SIZE);
        const res = await this.messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title, body: message.body },
          ...(message.data && Object.keys(message.data).length > 0
            ? { data: message.data }
            : {}),
          android: { priority: "high" },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
        });

        if (res.failureCount > 0) {
          const deadTokens = res.responses.flatMap((response, index) => {
            if (response.success) return [];
            const code = response.error?.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              return [chunk[index]];
            }
            return [];
          });
          if (deadTokens.length > 0) {
            await this.prisma.pushToken.updateMany({
              where: { token: { in: deadTokens } },
              data: { isActive: false },
            });
          }
          this.logger.warn(
            `Push FCM: ${res.failureCount}/${chunk.length} echecs (succes ${res.successCount}, jetons invalides revoques ${deadTokens.length}).`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        "Erreur envoi push FCM",
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
