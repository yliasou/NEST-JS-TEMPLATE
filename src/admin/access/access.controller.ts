import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../../common/i18n";
import { Roles } from "../../common/rbac/roles.decorator";
import { successResponse } from "../../common/utils/response.util";
import { ADMIN_PERMISSIONS } from "./constants/permissions.catalog";
import {
  ApiApplyAccessTemplate,
  ApiGetMyAccess,
  ApiGetUserAccess,
  ApiListAccessPermissions,
  ApiResetUserAccess,
  ApiUpdateUserAccess,
} from "./decorators/api-access.decorator";
import { RequirePermission } from "./decorators/require-permission.decorator";
import {
  PermissionsCatalogResponseSchemaDto,
  UserAccessResponseSchemaDto,
} from "./dto/access-response.dto";
import { ApplyAccessTemplateDto } from "./dto/apply-access-template.dto";
import { UpdateUserAccessDto } from "./dto/update-user-access.dto";
import { AdminAccessService } from "./services/admin-access.service";
import {
  type AuthedRequest,
  requireUserId,
} from "../../common/auth/authed-request";

@ApiTags("Admin — Accès & privilèges")
@ApiExtraModels(
  UpdateUserAccessDto,
  ApplyAccessTemplateDto,
  UserAccessResponseSchemaDto,
  PermissionsCatalogResponseSchemaDto,
)
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/access")
export class AdminAccessController {
  constructor(private readonly adminAccessService: AdminAccessService) {}

  @Get("permissions")
  @RequirePermission(ADMIN_PERMISSIONS.ACCESS_VIEW)
  @ApiListAccessPermissions()
  listPermissions(@Req() req: AuthedRequest) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = this.adminAccessService.getPermissionsCatalog();
    return successResponse(
      translate(locale, "adminAccessPermissionsFetched"),
      data,
      locale,
    );
  }

  @Get("me")
  @ApiGetMyAccess()
  async getMyAccess(@Req() req: AuthedRequest) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.adminAccessService.getUserAccessResponse(
      actorUserId,
      locale,
    );
    return successResponse(
      translate(locale, "adminAccessMeFetched"),
      data,
      locale,
    );
  }

  @Get("users/:userId")
  @RequirePermission(ADMIN_PERMISSIONS.ACCESS_VIEW)
  @ApiGetUserAccess()
  async getUserAccess(
    @Req() req: AuthedRequest,
    @Param("userId") userId: string,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.adminAccessService.getUserAccessResponse(
      userId,
      locale,
      { allowInactive: true },
    );
    await this.adminAccessService.recordAccessView(actorUserId, userId);
    return successResponse(
      translate(locale, "adminAccessUserFetched"),
      data,
      locale,
    );
  }

  @Patch("users/:userId")
  @RequirePermission(ADMIN_PERMISSIONS.ACCESS_UPDATE)
  @ApiUpdateUserAccess()
  async updateUserAccess(
    @Req() req: AuthedRequest,
    @Param("userId") userId: string,
    @Body() dto: UpdateUserAccessDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.adminAccessService.updateUserAccess(
      actorUserId,
      userId,
      {
        isSuperAdmin: dto.isSuperAdmin,
        permissions: dto.permissions,
      },
      locale,
    );
    return successResponse(
      translate(locale, "adminAccessUserUpdated"),
      data,
      locale,
    );
  }

  @Patch("users/:userId/reset")
  @RequirePermission(ADMIN_PERMISSIONS.ACCESS_RESET)
  @ApiResetUserAccess()
  async resetUserAccess(
    @Req() req: AuthedRequest,
    @Param("userId") userId: string,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.adminAccessService.resetUserAccess(
      actorUserId,
      userId,
      locale,
    );
    return successResponse(
      translate(locale, "adminAccessUserReset"),
      data,
      locale,
    );
  }

  @Patch("users/:userId/template")
  @RequirePermission(ADMIN_PERMISSIONS.ACCESS_ASSIGN_TEMPLATE)
  @ApiApplyAccessTemplate()
  async applyTemplate(
    @Req() req: AuthedRequest,
    @Param("userId") userId: string,
    @Body() dto: ApplyAccessTemplateDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.adminAccessService.applyTemplate(
      actorUserId,
      userId,
      dto.templateId,
      locale,
    );
    return successResponse(
      translate(locale, "adminAccessTemplateApplied"),
      data,
      locale,
    );
  }
}
