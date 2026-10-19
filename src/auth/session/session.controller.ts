import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  ApiAdminLogin,
  ApiLogout,
  ApiRefreshToken,
} from "./decorators/api-session.decorator";
import { normalizeLocale, translate, type Locale } from "../../common/i18n";
import {
  successResponse,
  validationErrorResponse,
} from "../../common/utils/response.util";
import { Public } from "../shared/decorators/public.decorator";
import { CurrentUser } from "../shared/decorators/current-user.decorator";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { LoginService } from "./services/login.service";
import { LogoutService } from "./services/logout.service";
import { TokenService } from "./services/token.service";
import { extractBearerToken } from "./utils/bearer-token.util";
import { authThrottleOptions } from "../../common/throttler/throttler.constants";
import {
  authTokensSnakeCase,
  authSuccessData,
} from "./utils/auth-response-mobile.util";

function requireRefreshToken(dto: RefreshTokenDto, locale: Locale): string {
  const raw = dto.refresh_token;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new UnprocessableEntityException(
      validationErrorResponse(
        [translate(locale, "refreshTokenRequired")],
        undefined,
        locale,
      ),
    );
  }
  return raw.trim();
}

/** Session : connexion admin, renouvellement et révocation des tokens (communs aux deux parcours). */
@ApiTags("Auth — Session")
@Controller("auth")
@Throttle(authThrottleOptions())
export class AuthSessionController {
  constructor(
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Post("admin/login")
  @HttpCode(HttpStatus.OK)
  @ApiAdminLogin()
  async loginAdmin(@Req() req: Request, @Body() dto: AdminLoginDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const result = await this.loginService.loginAdminWithEmail(
      dto.email,
      dto.password,
      locale,
    );
    return successResponse(
      translate(locale, "loginSuccess"),
      authSuccessData(result),
      locale,
    );
  }

  @Public()
  @Post(["refresh-token", "refresh"])
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshToken(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const token = requireRefreshToken(dto, locale);
    const result = await this.tokenService.refresh(token, locale);
    return successResponse(
      translate(locale, "tokensRefreshed"),
      authTokensSnakeCase(result),
    );
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiLogout()
  async logout(
    @Req() req: Request,
    @CurrentUser("sub") userId: string,
    @Body() dto: LogoutDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const accessToken = extractBearerToken(req);
    await this.logoutService.logout(
      userId,
      accessToken ?? "",
      dto.refresh_token,
      locale,
    );
    return successResponse(
      translate(locale, "logoutSuccess"),
      undefined,
      locale,
    );
  }
}
