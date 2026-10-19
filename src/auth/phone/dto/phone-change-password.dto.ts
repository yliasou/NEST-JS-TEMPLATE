import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { AUTH_SECRET_CODE_MIN_LENGTH } from "../../shared/auth-validation.constants";

export class PhoneChangePasswordDto {
  @ApiProperty({
    name: "security",
    description:
      "Jeton reçu après forgot-password, validé par verify-code (flux PASSWORD_RESET).",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  security: string;

  @ApiProperty({
    name: "secret_code",
    example: "1234",
    minLength: AUTH_SECRET_CODE_MIN_LENGTH,
    maxLength: 128,
    description: "Nouveau mot de passe du compte.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(AUTH_SECRET_CODE_MIN_LENGTH)
  @MaxLength(128)
  secret_code: string;
}
