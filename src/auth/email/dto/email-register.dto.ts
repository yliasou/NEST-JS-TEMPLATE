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
import { AUTH_EMAIL_PASSWORD_MIN_LENGTH } from "../../shared/auth-validation.constants";
import { normalizePhoneInput } from "../../phone/utils/phone-normalize.util";
import { RegisterProfileDto } from "../../registration/dto/register-profile.dto";

/** Inscription e-mail + mot de passe. La vérification de l'e-mail suit (code envoyé). */
export class EmailRegisterDto extends RegisterProfileDto {
  @ApiProperty({ example: "user@example.com" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: "MotDePasse123",
    minLength: AUTH_EMAIL_PASSWORD_MIN_LENGTH,
    maxLength: 128,
  })
  @IsString()
  @MinLength(AUTH_EMAIL_PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({
    name: "phone_number",
    type: String,
    nullable: true,
    example: "+33612345678",
    description:
      "Optionnel. Numéro E.164 (non vérifié : la vérification passe par le parcours téléphone).",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    return typeof value === "string" ? normalizePhoneInput(value) : value;
  })
  @ValidateIf((o) => o.phone_number !== null && o.phone_number !== undefined)
  @IsString()
  @Matches(/^\+[0-9]{8,20}$/, {
    message: "Le numéro doit inclure l'indicatif pays (ex. +33612345678).",
  })
  @MaxLength(32)
  phone_number?: string | null;
}
