import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  ApiAuthChangePassword,
  ApiAuthForgotPassword,
  ApiAuthSendCode,
  ApiAuthVerifyCode,
  ApiLogin,
  ApiRegister,
} from "./decorators/api-phone.decorator";
import { normalizeLocale, translate } from "../../common/i18n";
import { authThrottleOptions } from "../../common/throttler/throttler.constants";
import { successResponse } from "../../common/utils/response.util";
import { Public } from "../shared/decorators/public.decorator";
import { PhoneChangePasswordDto } from "./dto/phone-change-password.dto";
import { PhoneLoginDto } from "./dto/phone-login.dto";
import { PhoneNumberDto } from "./dto/phone-number.dto";
import { PhoneRegisterDto } from "./dto/phone-register.dto";
import { VerifyCodeDto } from "../otp/dto/verify-code.dto";
import { AuthVerifyFlow } from "../otp/enums/auth-verify-flow.enum";
import { AuthOtpService } from "../otp/services/auth-otp.service";
import { AuthPhoneService } from "./services/auth-phone.service";
import { LoginService } from "../session/services/login.service";
import { RegisterService } from "../registration/services/register.service";
import { authSuccessData } from "../session/utils/auth-response-mobile.util";

/** Parcours téléphone : OTP SMS (send-code → verify-code → register), puis PIN. */
@ApiTags("Auth — Téléphone")
@Controller("auth/phone")
@Throttle(authThrottleOptions())
export class AuthPhoneController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly authOtp: AuthOtpService,
    private readonly authPhone: AuthPhoneService,
  ) {}

  @Public()
  @Post("send-code")
  @HttpCode(HttpStatus.OK)
  @ApiAuthSendCode()
  async sendCode(@Req() req: Request, @Body() dto: PhoneNumberDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.authOtp.sendCode(dto.phone_number, locale);
    return successResponse(translate(locale, "otpSent"), data, locale);
  }

  @Public()
  @Post("verify-code")
  @HttpCode(HttpStatus.OK)
  @ApiAuthVerifyCode()
  async verifyCode(@Req() req: Request, @Body() dto: VerifyCodeDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { request_type } = await this.authOtp.verifyCode(
      dto.security,
      dto.code,
      locale,
    );

    const data: { request_type: AuthVerifyFlow; security?: string } = {
      request_type,
    };
    if (
      request_type === AuthVerifyFlow.NEW_ACCOUNT ||
      request_type === AuthVerifyFlow.PASSWORD_RESET
    ) {
      data.security = dto.security.trim();
    }

    return successResponse(translate(locale, "otpVerified"), data, locale);
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiRegister()
  async register(@Req() req: Request, @Body() dto: PhoneRegisterDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const result = await this.registerService.registerWithPhone(dto, locale);
    return successResponse(
      translate(locale, "signupSuccess"),
      authSuccessData(result),
      locale,
    );
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(@Req() req: Request, @Body() dto: PhoneLoginDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const result = await this.loginService.loginWithPhone(
      dto.phone_number,
      dto.secret_code,
      locale,
    );
    return successResponse(
      translate(locale, "loginSuccess"),
      authSuccessData(result),
      locale,
    );
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiAuthForgotPassword()
  async forgotPassword(@Req() req: Request, @Body() dto: PhoneNumberDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const phone = this.authPhone.normalizeRequiringDialCode(
      dto.phone_number,
      locale,
    );
    const data = await this.authOtp.beginPasswordReset(
      { channel: "phone", value: phone },
      locale,
    );
    return successResponse(translate(locale, "otpSent"), data, locale);
  }

  @Public()
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiAuthChangePassword()
  async changePassword(
    @Req() req: Request,
    @Body() dto: PhoneChangePasswordDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    await this.authOtp.applyPasswordChange(
      dto.security,
      dto.secret_code,
      locale,
    );
    return successResponse(
      translate(locale, "passwordResetSuccess"),
      undefined,
      locale,
    );
  }
}
