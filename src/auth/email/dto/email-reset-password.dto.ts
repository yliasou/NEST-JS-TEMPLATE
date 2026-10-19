import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { AUTH_EMAIL_PASSWORD_MIN_LENGTH } from "../../shared/auth-validation.constants";
import { VerifyCodeDto } from "../../otp/dto/verify-code.dto";

/** Code reçu par e-mail (forgot-password) + nouveau mot de passe. */
export class EmailResetPasswordDto extends VerifyCodeDto {
  @ApiProperty({
    example: "NouveauMotDePasse123",
    minLength: AUTH_EMAIL_PASSWORD_MIN_LENGTH,
    maxLength: 128,
  })
  @IsString()
  @MinLength(AUTH_EMAIL_PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  password: string;
}
