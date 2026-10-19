import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

/** Au plus une écriture de présence par utilisateur et par minute. */
export const LAST_REQUEST_TOUCH_INTERVAL_MS = 60_000;

/**
 * Vrai seulement si la dernière présence connue (base ou écriture déjà lancée)
 * est plus vieille que l'intervalle. Évite un UPDATE à chaque requête.
 */
export function shouldPersistLastRequest(
  lastRequestAt: Date | null | undefined,
  nowMs: number,
  pendingSinceMs?: number,
): boolean {
  if (
    pendingSinceMs !== undefined &&
    nowMs - pendingSinceMs < LAST_REQUEST_TOUCH_INTERVAL_MS
  ) {
    return false;
  }
  if (
    lastRequestAt &&
    nowMs - lastRequestAt.getTime() < LAST_REQUEST_TOUCH_INTERVAL_MS
  ) {
    return false;
  }
  return true;
}

/** Met à jour la session (`lastLoginAt`) et la présence (`lastRequestAt`). */
@Injectable()
export class AuthUserSessionService {
  private readonly logger = new Logger(AuthUserSessionService.name);
  private readonly pendingSince = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  touchLastLoginAt(userId: string): void {
    const now = new Date();
    this.pendingSince.set(userId, now.getTime());
    void this.prisma.user
      .update({
        where: { id: userId },
        data: { lastLoginAt: now, lastRequestAt: now },
      })
      .catch((err: unknown) => {
        this.pendingSince.delete(userId);
        this.logger.warn(
          `Failed to update lastLoginAt for user ${userId}`,
          err instanceof Error ? err.stack : String(err),
        );
      });
  }

  /**
   * Présence sur requête déjà authentifiée.
   * `lastRequestAt` vient du SELECT déjà fait par le garde JWT : aucun SELECT en plus.
   * L'UPDATE est ignoré si la présence a moins d'une minute, et n'avance pas `updatedAt`.
   */
  noteAuthenticatedRequest(
    userId: string,
    lastRequestAt: Date | null | undefined,
  ): void {
    const nowMs = Date.now();
    if (
      !shouldPersistLastRequest(
        lastRequestAt,
        nowMs,
        this.pendingSince.get(userId),
      )
    ) {
      return;
    }

    this.pendingSince.set(userId, nowMs);
    this.prunePending(nowMs);
    const now = new Date(nowMs);
    void this.prisma.$executeRaw`
        UPDATE "User"
        SET "lastRequestAt" = ${now}
        WHERE "id" = ${userId}
      `.catch((err: unknown) => {
      this.pendingSince.delete(userId);
      this.logger.warn(
        `Failed to update lastRequestAt for user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
    });
  }

  private prunePending(nowMs: number): void {
    if (this.pendingSince.size < 5000) return;
    for (const [id, at] of this.pendingSince) {
      if (nowMs - at >= LAST_REQUEST_TOUCH_INTERVAL_MS) {
        this.pendingSince.delete(id);
      }
    }
  }
}
