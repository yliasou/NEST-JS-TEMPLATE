import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { normalizeLocale, translate } from "../../common/i18n";
import { authThrottleOptions } from "../../common/throttler/throttler.constants";
import { successResponse } from "../../common/utils/response.util";
import {
  ApiAuthCheckEmail,
  ApiEmailForgotPassword,
  ApiEmailLogin,
  ApiEmailRegister,
  ApiEmailResendVerification,
  ApiEmailResetPassword,
  ApiEmailVerify,
} from "./decorators/api-email.decorator";
import { CurrentUser } from "../shared/decorators/current-user.decorator";
import { Public } from "../shared/decorators/public.decorator";
import { CheckEmailDto } from "./dto/check-email.dto";
import { EmailAddressDto } from "./dto/email-address.dto";
import { EmailLoginDto } from "./dto/email-login.dto";
import { EmailRegisterDto } from "./dto/email-register.dto";
import { EmailResetPasswordDto } from "./dto/email-reset-password.dto";
import { VerifyCodeDto } from "../otp/dto/verify-code.dto";
import { AuthEmailService } from "./services/auth-email.service";
import { AuthOtpService } from "../otp/services/auth-otp.service";
import { LoginService } from "../session/services/login.service";
import { RegisterService } from "../registration/services/register.service";
import { authSuccessData } from "../session/utils/auth-response-mobile.util";

/** Parcours e-mail : e-mail + mot de passe, vérification de l'adresse par code. */
@ApiTags("Auth — E-mail")
@Controller("auth/email")
@Throttle(authThrottleOptions())
export class AuthEmailController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly authOtp: AuthOtpService,
    private readonly authEmail: AuthEmailService,
  ) {}

  @Public()
  @Get("check-email")
  @HttpCode(HttpStatus.OK)
  @ApiAuthCheckEmail()
  async checkEmail(@Req() req: Request, @Query() dto: CheckEmailDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.registerService.checkEmailExists(dto.email);
    return successResponse(
      data.exists
        ? translate(locale, "emailAlreadyUsed")
        : translate(locale, "emailAvailable"),
      data,
      locale,
    );
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiEmailRegister()
  async register(@Req() req: Request, @Body() dto: EmailRegisterDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { auth, emailVerification } =
      await this.registerService.registerWithEmail(dto, locale);
    return successResponse(
      translate(locale, "signupSuccess"),
      { ...authSuccessData(auth), email_verification: emailVerification },
      locale,
    );
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiEmailLogin()
  async login(@Req() req: Request, @Body() dto: EmailLoginDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const result = await this.loginService.loginWithEmail(
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
  @Post("verify")
  @HttpCode(HttpStatus.OK)
  @ApiEmailVerify()
  async verify(@Req() req: Request, @Body() dto: VerifyCodeDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    await this.authOtp.confirmEmailVerification(dto.security, dto.code, locale);
    return successResponse(
      translate(locale, "emailVerified"),
      { email_verified: true },
      locale,
    );
  }

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiEmailResendVerification()
  async resendVerification(
    @Req() req: Request,
    @CurrentUser("sub") userId: string,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.authEmail.resendVerification(userId, locale);
    return successResponse(translate(locale, "otpSent"), data, locale);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiEmailForgotPassword()
  async forgotPassword(@Req() req: Request, @Body() dto: EmailAddressDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.authOtp.beginPasswordReset(
      { channel: "email", value: dto.email },
      locale,
    );
    return successResponse(translate(locale, "otpSent"), data, locale);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiEmailResetPassword()
  async resetPassword(@Req() req: Request, @Body() dto: EmailResetPasswordDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    await this.authOtp.resetPasswordWithEmailCode(
      dto.security,
      dto.code,
      dto.password,
      locale,
    );
    return successResponse(
      translate(locale, "passwordResetSuccess"),
      undefined,
      locale,
    );
  }
}
