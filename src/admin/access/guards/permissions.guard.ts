import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { normalizeLocale, translate, type Locale } from "../../../common/i18n";
import {
  REQUIRE_PERMISSIONS_KEY,
  type RequirePermissionsMeta,
} from "../decorators/require-permission.decorator";
import { AdminAccessService } from "../services/admin-access.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<RequirePermissionsMeta>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!meta?.permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const locale = this.locale(request);
    const user = request["user"] as
      | { id?: string; sub?: string; role?: string }
      | undefined;
    const userId = user?.id ?? user?.sub;

    if (!userId) {
      throw new UnauthorizedException(translate(locale, "unauthorizedSummary"));
    }

    if (meta.mode === "any") {
      await this.adminAccessService.assertAnyPermission(
        userId,
        meta.permissions,
        locale,
      );
      return true;
    }

    for (const permission of meta.permissions) {
      const allowed = await this.adminAccessService.hasPermission(
        userId,
        permission,
        locale,
      );
      if (!allowed) {
        throw new ForbiddenException(translate(locale, "forbidden"));
      }
    }

    return true;
  }

  private locale(req: Request): Locale {
    return (
      (req as Request & { locale?: Locale }).locale ??
      normalizeLocale(req.headers.language as string)
    );
  }
}
