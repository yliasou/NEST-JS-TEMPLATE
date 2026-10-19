import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../../common/i18n";
import { Roles } from "../../common/rbac/roles.decorator";
import { MARKETING_PERMISSIONS, RequirePermission } from "../../admin/access";
import {
  paginatedResponse,
  successResponse,
} from "../../common/utils/response.util";
import {
  ApiAdminListSentNotifications,
  ApiAdminGetSentNotification,
  ApiAdminSendNotificationToRole,
  ApiAdminSendNotificationToUser,
} from "./decorators/api-campaigns.decorator";
import { AdminSendNotificationDto } from "./dto/admin-send-notification.dto";
import { AdminSentNotificationsQueryDto } from "./dto/admin-sent-notifications-query.dto";
import {
  AdminSentNotificationDetailResponseSchemaDto,
  AdminSentNotificationsPaginatedResponseSchemaDto,
} from "./dto/admin-sent-notifications-response.dto";
import { NotificationsService } from "../notifications.service";
import {
  type AuthedRequest,
  requireUserId,
} from "../../common/auth/authed-request";

@ApiTags("Admin - Notifications")
@ApiBearerAuth()
@ApiExtraModels(
  AdminSendNotificationDto,
  AdminSentNotificationsPaginatedResponseSchemaDto,
  AdminSentNotificationDetailResponseSchemaDto,
)
@Roles(Role.ADMIN)
@Controller("admin/notifications")
export class NotificationCampaignsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("sent")
  @RequirePermission(MARKETING_PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiAdminListSentNotifications()
  async listSent(
    @Req() req: AuthedRequest,
    @Query() query: AdminSentNotificationsQueryDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } =
      await this.notificationsService.listAdminSentNotifications(query);
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "adminSentNotificationsFetched"),
      locale,
    );
  }

  @Get("sent/:campaignId")
  @RequirePermission(MARKETING_PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiAdminGetSentNotification()
  async getSent(
    @Req() req: AuthedRequest,
    @Param("campaignId") campaignId: string,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.notificationsService.getAdminSentNotification(
      campaignId,
      locale,
    );
    return successResponse(
      translate(locale, "adminSentNotificationFetched"),
      data,
      locale,
    );
  }

  @Post("send/push-notification/user/:userId")
  @RequirePermission(MARKETING_PERMISSIONS.NOTIFICATIONS_SEND)
  @HttpCode(HttpStatus.OK)
  @ApiAdminSendNotificationToUser()
  async sendToUser(
    @Req() req: AuthedRequest,
    @Param("userId") userId: string,
    @Body() dto: AdminSendNotificationDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.notificationsService.sendAdminNotificationToUser(
      userId,
      dto.title,
      dto.message,
      actorUserId,
      locale,
    );
    return successResponse(
      translate(locale, "adminNotificationSent"),
      data,
      locale,
    );
  }

  @Post("send/push-notification/role/:role")
  @RequirePermission(MARKETING_PERMISSIONS.NOTIFICATIONS_SEND)
  @HttpCode(HttpStatus.OK)
  @ApiAdminSendNotificationToRole()
  async sendToRole(
    @Req() req: AuthedRequest,
    @Param("role", new ParseEnumPipe(Role)) role: Role,
    @Body() dto: AdminSendNotificationDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.notificationsService.sendAdminNotificationToRole(
      role,
      dto.title,
      dto.message,
      actorUserId,
    );
    return successResponse(
      translate(locale, "adminNotificationSent"),
      data,
      locale,
    );
  }
}
