import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { AuditTrailsService } from "../../audit-trails.service";
import { getAuditRequestContext } from "../context/audit-request-context";
import {
  type AuthedRequest,
  getUserId,
} from "../../../common/auth/authed-request";

/** Express 5 type les paramètres de route wildcard (`*splat`) en `string[]`. */
function toStringParams(
  params: Record<string, string | string[]>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join("/") : value,
    ]),
  );
}

@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  constructor(private readonly auditTrailsService: AuditTrailsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    const res = http.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      finalize(() => {
        const auditContext = getAuditRequestContext();
        const actorUserId = getUserId(req);
        const requestId =
          typeof req.headers["x-request-id"] === "string"
            ? req.headers["x-request-id"]
            : undefined;
        const userAgent =
          typeof req.headers["user-agent"] === "string"
            ? req.headers["user-agent"]
            : undefined;

        void this.auditTrailsService.recordHttpTrail({
          method: req.method,
          path: req.originalUrl ?? req.url,
          statusCode: res.statusCode,
          actorUserId,
          requestId: requestId ?? auditContext?.requestId,
          ip: auditContext?.ip ?? req.ip,
          latitude: auditContext?.latitude,
          longitude: auditContext?.longitude,
          locationAccuracy: auditContext?.locationAccuracy,
          locationCapturedAt: auditContext?.locationCapturedAt,
          userAgent: userAgent ?? auditContext?.userAgent,
          params: toStringParams(req.params),
          body:
            req.body && typeof req.body === "object"
              ? (req.body as Record<string, unknown>)
              : undefined,
        });
      }),
    );
  }
}
