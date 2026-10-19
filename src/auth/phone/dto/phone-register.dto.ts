import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { AUTH_SECRET_CODE_MIN_LENGTH } from "../../shared/auth-validation.constants";
import { normalizePhoneInput } from "../utils/phone-normalize.util";
import { RegisterProfileDto } from "../../registration/dto/register-profile.dto";

/** Inscription téléphone : après send-code + verify-code. */
export class PhoneRegisterDto extends RegisterProfileDto {
  @ApiProperty({
    name: "security",
    description:
      "Jeton reçu après send-code et verify-code (téléphone vérifié).",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  security: string;

  @ApiProperty({
    name: "phone_number",
    example: "+33612345678",
    description:
      "Numéro déjà vérifié par OTP, au format E.164 (identique à send-code).",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? normalizePhoneInput(value) : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[0-9]{8,20}$/, {
    message: "Le numéro doit inclure l'indicatif pays (ex. +33612345678).",
  })
  @MaxLength(32)
  phone_number: string;

  @ApiProperty({
    name: "secret_code",
    example: "1234",
    minLength: AUTH_SECRET_CODE_MIN_LENGTH,
    description: "Mot de passe du compte.",
  })
  @IsString()
  @MinLength(AUTH_SECRET_CODE_MIN_LENGTH)
  @MaxLength(128)
  secret_code: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "user@example.com",
    description:
      "Optionnel. E-mail du compte (non vérifié : passer par /auth/email/resend-verification).",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (typeof value === "string") return value.trim().toLowerCase();
    return value;
  })
  @ValidateIf((o) => o.email !== null && o.email !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string | null;
}
