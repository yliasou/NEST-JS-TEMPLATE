import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { resolveClientIp } from "../../../common/utils/client-ip.util";

export interface AuditRequestContext {
  ip?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationCapturedAt?: Date;
  userAgent?: string;
  requestId?: string;
}

const auditContextStorage = new AsyncLocalStorage<AuditRequestContext>();

/** Contexte HTTP courant (ip, userAgent, requestId) ou undefined hors requête. */
export function getAuditRequestContext(): AuditRequestContext | undefined {
  return auditContextStorage.getStore();
}

function parseHeaderNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.trim() === "") return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseHeaderDate(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.trim() === "") return undefined;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function resolveClientLocation(req: Request) {
  const latitude = parseHeaderNumber(req.headers["x-client-latitude"]);
  const longitude = parseHeaderNumber(req.headers["x-client-longitude"]);

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {};
  }

  const locationAccuracy = parseHeaderNumber(
    req.headers["x-client-location-accuracy"],
  );
  const locationCapturedAt = parseHeaderDate(
    req.headers["x-client-location-captured-at"],
  );

  return {
    latitude,
    longitude,
    ...(locationAccuracy !== undefined && locationAccuracy >= 0
      ? { locationAccuracy }
      : {}),
    ...(locationCapturedAt ? { locationCapturedAt } : {}),
  };
}

/**
 * Capture ip / geoloc / userAgent / requestId de chaque requête HTTP dans un
 * AsyncLocalStorage, pour que les audits explicites (recordAction) puissent
 * les retrouver sans que chaque service ait à transporter la requête.
 */
@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerRequestId = req.headers["x-request-id"];
    const requestId =
      (typeof headerRequestId === "string" && headerRequestId.trim()) ||
      randomUUID();

    const userAgent =
      typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"]
        : undefined;

    res.setHeader("x-request-id", requestId);

    auditContextStorage.run(
      {
        ip: resolveClientIp(req),
        ...resolveClientLocation(req),
        userAgent,
        requestId,
      },
      () => next(),
    );
  }
}
