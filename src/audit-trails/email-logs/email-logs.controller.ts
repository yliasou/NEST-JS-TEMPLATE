import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../../common/i18n";
import { Roles } from "../../common/rbac/roles.decorator";
import { paginatedResponse } from "../../common/utils/response.util";
import { ADMIN_PERMISSIONS } from "../../admin/access/constants/permissions.catalog";
import { RequirePermission } from "../../admin/access/decorators/require-permission.decorator";
import { type AuthedRequest } from "../../common/auth/authed-request";
import { AuditTrailsService } from "../audit-trails.service";
import { EmailLogsQueryDto } from "./dto/email-logs-query.dto";

@ApiTags("Admin - Audit Trails")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/audit-trails/email-logs")
export class EmailLogsController {
  constructor(private readonly auditTrailsService: AuditTrailsService) {}

  @Get()
  @RequirePermission(ADMIN_PERMISSIONS.AUDIT_VIEW)
  async listEmailLogs(
    @Req() req: AuthedRequest,
    @Query() query: EmailLogsQueryDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } =
      await this.auditTrailsService.listEmailLogs(query);
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "emailLogsFetched"),
      locale,
    );
  }
}
