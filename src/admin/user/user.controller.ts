import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../../common/i18n";
import { Roles } from "../../common/rbac/roles.decorator";
import {
  paginatedResponse,
  successResponse,
} from "../../common/utils/response.util";
import { ADMIN_PERMISSIONS, RequirePermission } from "../access";
import {
  ApiCountConnectedUsers,
  ApiCreateUser,
  ApiGetUser,
  ApiListUsers,
  ApiSetPermanentOtp,
  ApiUpdateUser,
} from "./decorators/api-user.decorator";
import { ConnectedUsersQueryDto } from "./dto/connected-users-query.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { SetPermanentOtpDto } from "./dto/set-permanent-otp.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersQueryDto } from "./dto/users-query.dto";
import { UsersService } from "./services/users.service";
import {
  type AuthedRequest,
  requireUserId,
} from "../../common/auth/authed-request";

@ApiTags("Admin — Utilisateurs")
@ApiExtraModels(CreateUserDto, UpdateUserDto, ConnectedUsersQueryDto)
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/users")
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission(ADMIN_PERMISSIONS.USERS_VIEW)
  @ApiListUsers()
  async findAll(@Req() req: AuthedRequest, @Query() query: UsersQueryDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } = await this.usersService.findAll(query);
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "usersFetched"),
      locale,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ADMIN_PERMISSIONS.USERS_CREATE)
  @ApiCreateUser()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateUserDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.usersService.create(dto, locale, actorUserId);
    return successResponse(translate(locale, "userCreated"), data, locale);
  }

  @Get("connected/count")
  @RequirePermission(ADMIN_PERMISSIONS.USERS_CONNECTED_VIEW)
  @ApiCountConnectedUsers()
  async countConnected(
    @Req() req: AuthedRequest,
    @Query() query: ConnectedUsersQueryDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.usersService.countConnected(query);
    return successResponse(
      translate(locale, "usersConnectedCountFetched"),
      data,
      locale,
    );
  }

  @Get(":id")
  @RequirePermission(ADMIN_PERMISSIONS.USERS_VIEW)
  @ApiGetUser()
  async findOne(@Req() req: AuthedRequest, @Param("id") id: string) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.usersService.findOne(id, locale);
    return successResponse(translate(locale, "userFetched"), data, locale);
  }

  @Patch(":id/permanent-otp")
  @RequirePermission(ADMIN_PERMISSIONS.USERS_PERMANENT_OTP)
  @ApiSetPermanentOtp()
  async setPermanentOtp(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: SetPermanentOtpDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.usersService.setPermanentOtp(
      id,
      dto.code ?? null,
      locale,
      actorUserId,
    );
    return successResponse(
      translate(locale, "permanentOtpUpdated"),
      data,
      locale,
    );
  }

  @Patch(":id")
  @RequirePermission(ADMIN_PERMISSIONS.USERS_UPDATE)
  @ApiUpdateUser()
  async update(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const actorUserId = requireUserId(req);
    const data = await this.usersService.update(id, dto, locale, actorUserId);
    const definedKeys = Object.entries(dto as Record<string, unknown>)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    const isStatusToggleOnly =
      definedKeys.includes("isActive") &&
      definedKeys.every(
        (key) => key === "isActive" || key === "suspensionReason",
      );
    const messageKey =
      isStatusToggleOnly && dto.isActive === false
        ? "userSuspended"
        : isStatusToggleOnly && dto.isActive === true
          ? "userRestored"
          : "userUpdated";
    return successResponse(translate(locale, messageKey), data, locale);
  }
}
