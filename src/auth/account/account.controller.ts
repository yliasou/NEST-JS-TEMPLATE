import { Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiDeactivateAccount } from "./decorators/api-account.decorator";
import { normalizeLocale, translate } from "../../common/i18n";
import { authThrottleOptions } from "../../common/throttler/throttler.constants";
import { successResponse } from "../../common/utils/response.util";
import { DeactivateAccountService } from "./services/deactivate-account.service";
import { extractBearerToken } from "../session/utils/bearer-token.util";
import {
  type AuthedRequest,
  requireUserId,
} from "../../common/auth/authed-request";

@ApiTags("Auth")
@ApiBearerAuth()
@Throttle(authThrottleOptions())
@Controller("auth")
export class AuthAccountController {
  constructor(
    private readonly deactivateAccountService: DeactivateAccountService,
  ) {}

  @Post("deactivate-account")
  @HttpCode(HttpStatus.OK)
  @ApiDeactivateAccount()
  async deactivateAccount(@Req() req: AuthedRequest) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = requireUserId(req);
    const accessToken = extractBearerToken(req);
    await this.deactivateAccountService.deactivate(
      userId,
      accessToken ?? "",
      locale,
    );
    return successResponse(
      translate(locale, "accountDeactivated"),
      undefined,
      locale,
    );
  }
}
