import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, type ThrottlerRequest } from "@nestjs/throttler";
import type { Request } from "express";
import { resolveClientIp } from "../utils/client-ip.util";
import { extractAuthThrottleIdentity } from "./auth-throttle-identity.util";

/**
 * Rate limiting en deux buckets :
 * 1. IP (comportement Nest par défaut, IP publique si proxy)
 * 2. Identifiant auth (e-mail ou téléphone) quand présent dans body/query
 *
 * Le second bucket empêche de contourner la limite en rotant les IP
 * contre le même compte.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const ip =
      resolveClientIp(req as unknown as Request) ??
      (typeof req.ip === "string" ? req.ip : undefined);
    return Promise.resolve(ip || "unknown");
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    await super.handleRequest(requestProps);

    const { context, limit, ttl, throttler, blockDuration, generateKey } =
      requestProps;
    const { req, res } = this.getRequestResponse(context);
    const identity = extractAuthThrottleIdentity(req);
    if (!identity) {
      return true;
    }

    const tracker = identity;
    const throttlerName = `${throttler.name}-identity`;
    const key = generateKey(context, tracker, throttlerName);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );

    if (isBlocked) {
      this.setResponseHeader(res, "Retry-After", timeToBlockExpire);
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }
}
