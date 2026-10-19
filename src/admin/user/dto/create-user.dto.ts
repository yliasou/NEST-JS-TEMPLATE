import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AdminLevel, Role } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import {
  adminUserPasswordErrorMessage,
  isAdminUserPasswordValid,
} from "../../../auth/shared/auth-validation.constants";
import { normalizePhoneInput } from "../../../auth/phone/utils/phone-normalize.util";

@ValidatorConstraint({ name: "adminCreateUserPasswordMinLength", async: false })
class AdminCreateUserPasswordMinLengthConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== "string") return false;
    return isAdminUserPasswordValid(
      value,
      (args.object as { role?: Role }).role,
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const role = (args.object as { role?: Role }).role;
    const value = typeof args.value === "string" ? args.value : "";
    return adminUserPasswordErrorMessage(value, role);
  }
}

export class CreateUserDto {
  @ApiProperty({ enum: Role, description: "Rôle du compte." })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ example: "contact@entreprise.com" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: "Motdepasse8",
    description:
      "Mot de passe (hash bcrypt côté serveur, chaîne). Minimum 8 caractères. Un compte `USER` accepte aussi un PIN de 4 chiffres (zéros initiaux conservés).",
  })
  @IsString()
  @Validate(AdminCreateUserPasswordMinLengthConstraint)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    example: "+33612345678",
    description: "Optionnel. Format E.164 avec indicatif pays.",
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return typeof value === "string" ? normalizePhoneInput(value) : value;
  })
  @ValidateIf((o) => o.phone !== undefined && o.phone !== null)
  @IsString()
  @Matches(/^\+?[0-9]{8,20}$/, {
    message:
      "Le numéro de téléphone doit contenir 8 à 20 chiffres (préfixe + autorisé).",
  })
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ example: "Ada" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: "Lovelace" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({
    type: String,
    description: "URL publique de la photo de profil.",
    example: "https://example.com/storage/avatars/user-1.jpg",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(2048)
  @Matches(/^https?:\/\//, {
    message: "L'avatar doit être une URL http(s) valide.",
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: "Par défaut `true`.",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** ADMIN — profil interne */
  @ApiPropertyOptional({
    enum: AdminLevel,
    description: "Niveau d'équipe si `role` = ADMIN. Par défaut : EMPLOYEE.",
  })
  @ValidateIf((o) => o.role === Role.ADMIN)
  @IsOptional()
  @IsEnum(AdminLevel)
  adminLevel?: AdminLevel;

  @ApiPropertyOptional({
    description: "Service / département (optionnel, si `role` = ADMIN).",
    example: "Operations",
  })
  @ValidateIf((o) => o.role === Role.ADMIN)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(120)
  department?: string;
}
