import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuditTrailsModule } from "../audit-trails/audit-trails.module";
import { AuthSessionController } from "./session/session.controller";
import { AuthAccountController } from "./account/account.controller";
import { AuthEmailController } from "./email/email.controller";
import { AuthPhoneController } from "./phone/phone.controller";
import { AuthEmailService } from "./email/services/auth-email.service";
import { JwtAuthGuard } from "./shared/guards/jwt-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { getJwtAccessExpiresInSeconds } from "./session/config/jwt-expiry.config";
import {
  AuthOtpDeliveryService,
  AuthOtpEmailVerificationService,
  AuthOtpPasswordResetService,
  AuthOtpRegistrationService,
  AuthOtpSendCodeService,
  AuthOtpService,
  AuthOtpStore,
  AuthOtpVerifyService,
} from "./otp";
import { TokenService } from "./session/services/token.service";
import { RegisterService } from "./registration/services/register.service";
import { LoginService } from "./session/services/login.service";
import { LogoutService } from "./session/services/logout.service";
import { DeactivateAccountService } from "./account/services/deactivate-account.service";
import { AuthPhoneService } from "./phone/services/auth-phone.service";
import { AuthTokenRevocationStore } from "./session/services/auth-token-revocation.store";
import { AuthUserSessionService } from "./session/services/auth-user-session.service";

@Module({
  imports: [
    PrismaModule,
    AuditTrailsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: getJwtAccessExpiresInSeconds(),
        },
      }),
    }),
  ],
  controllers: [
    AuthSessionController,
    AuthPhoneController,
    AuthEmailController,
    AuthAccountController,
  ],
  providers: [
    AuthTokenRevocationStore,
    AuthUserSessionService,
    AuthPhoneService,
    AuthEmailService,
    TokenService,
    RegisterService,
    LoginService,
    LogoutService,
    DeactivateAccountService,
    AuthOtpDeliveryService,
    AuthOtpStore,
    AuthOtpSendCodeService,
    AuthOtpPasswordResetService,
    AuthOtpRegistrationService,
    AuthOtpVerifyService,
    AuthOtpEmailVerificationService,
    AuthOtpService,
    JwtAuthGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
  exports: [
    TokenService,
    RegisterService,
    JwtModule,
    JwtAuthGuard,
    AuthUserSessionService,
  ],
})
export class AuthModule {}
