import {
  Body,
  Controller,
  Get,
  HttpException,
  Logger,
  Patch,
  Put,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { normalizeLocale, translate, type Locale } from "../common/i18n";
import {
  ApiProfileMe,
  ApiUpdateProfile,
  ApiUpsertPushToken,
} from "./decorators/api-profile.decorator";
import { successResponse } from "../common/utils/response.util";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpsertPushTokenDto } from "./dto/upsert-push-token.dto";
import {
  type AuthedRequest,
  requireUserId,
} from "../common/auth/authed-request";

@ApiTags("Profile")
@ApiBearerAuth()
@Controller("profile")
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  @Get("me")
  @ApiProfileMe()
  async me(@Req() req: AuthedRequest) {
    const startedAt = Date.now();
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = requireUserId(req);
    let statusCode = 200;

    try {
      const user = await this.profileService.me(userId);
      return successResponse(translate(locale, "profileFetched"), user, locale);
    } catch (error) {
      statusCode = error instanceof HttpException ? error.getStatus() : 500;
      throw error;
    } finally {
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `GET /profile/me - userId=${userId} - ${statusCode} - ${durationMs}ms`,
      );
    }
  }

  @Patch("me")
  @ApiUpdateProfile()
  async updateMe(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    const locale: Locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = requireUserId(req);
    const updated = await this.profileService.update(userId, dto, locale);
    return successResponse(
      translate(locale, "profileUpdated"),
      updated,
      locale,
    );
  }

  @Put("me/push-token")
  @ApiUpsertPushToken()
  async upsertPushToken(
    @Req() req: AuthedRequest,
    @Body() dto: UpsertPushTokenDto,
  ) {
    const locale: Locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = requireUserId(req);
    const pushToken = await this.profileService.upsertPushToken(userId, dto);
    return successResponse(
      translate(locale, "pushTokenUpserted"),
      pushToken,
      locale,
    );
  }
}
