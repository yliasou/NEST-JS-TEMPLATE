import { Controller, Get, HttpStatus, Query, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiProduces, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import type { Response } from "express";
import { normalizeLocale, translate } from "../../common/i18n";
import { Roles } from "../../common/rbac/roles.decorator";
import { paginatedResponse } from "../../common/utils/response.util";
import { ADMIN_PERMISSIONS } from "../../admin/access/constants/permissions.catalog";
import { RequirePermission } from "../../admin/access/decorators/require-permission.decorator";
import { type AuthedRequest } from "../../common/auth/authed-request";
import { AuditTrailsService } from "../audit-trails.service";
import { ApiListAuditLogs } from "./decorators/api-audit-logs.decorator";
import { AuditLogsQueryDto } from "./dto/audit-logs-query.dto";

@ApiTags("Admin - Audit Trails")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/audit-trails/audit-logs")
export class AuditLogsController {
  constructor(private readonly auditTrailsService: AuditTrailsService) {}

  @Get()
  @RequirePermission(ADMIN_PERMISSIONS.AUDIT_VIEW)
  @ApiListAuditLogs()
  async listAuditLogs(
    @Req() req: AuthedRequest,
    @Query() query: AuditLogsQueryDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } =
      await this.auditTrailsService.listAuditLogs(query);
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "auditLogsFetched"),
      locale,
    );
  }

  @Get("export")
  @RequirePermission(ADMIN_PERMISSIONS.AUDIT_EXPORT)
  @ApiProduces("text/csv")
  async exportAuditLogs(
    @Query() query: AuditLogsQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.auditTrailsService.exportAuditLogsCsv(query);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `audit-trail-${stamp}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(HttpStatus.OK).send(csv);
  }
}
