import { Controller, Delete, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../common/i18n";
import { Roles } from "../common/rbac/roles.decorator";
import { ADMIN_PERMISSIONS, RequirePermission } from "../admin/access";
import { successResponse } from "../common/utils/response.util";
import { ApiAdminRedisFlushCache } from "./decorators/api-redis.decorator";
import { RedisCleanupService } from "./redis-cleanup.service";
import { type AuthedRequest } from "../common/auth/authed-request";

@ApiTags("Admin — Redis")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/redis")
export class RedisController {
  constructor(private readonly redisCleanupService: RedisCleanupService) {}

  @Delete("cache")
  @RequirePermission(ADMIN_PERMISSIONS.SETTINGS_UPDATE)
  @ApiAdminRedisFlushCache()
  async flushCache(@Req() req: AuthedRequest) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.redisCleanupService.flushAll(locale);
    return successResponse(
      translate(locale, "redisCacheCleared"),
      data,
      locale,
    );
  }
}
