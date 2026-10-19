import { ApiPropertyOptional } from "@nestjs/swagger";
import { AdminLevel } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { ADMIN_APP_USER_PASSWORD_LENGTH } from "../../../auth/shared/auth-validation.constants";
import { normalizePhoneInput } from "../../../auth/phone/utils/phone-normalize.util";

/** Mise à jour partielle d’un utilisateur (admin). Au moins un champ requis. */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "`false` pour désactiver le compte, `true` pour le réactiver.",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "nouveau@example.com" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "+2250707070707",
    description: "null ou chaîne vide après trim = retirer le téléphone.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (typeof value === "string") return normalizePhoneInput(value);
    return value;
  })
  @ValidateIf((o) => o.phone !== null && o.phone !== undefined)
  @IsString()
  @Matches(/^\+?[0-9]{8,20}$/, {
    message:
      "Le numéro de téléphone doit contenir 8 à 20 chiffres (préfixe + autorisé).",
  })
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional({
    example: "0000",
    description:
      "Si fourni, remplace le mot de passe (bcrypt). Minimum 8 caractères ; un compte USER accepte aussi un PIN de 4 chiffres. Chaîne vide = ne pas changer.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  })
  @IsString()
  @MinLength(ADMIN_APP_USER_PASSWORD_LENGTH)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    description:
      "Motif de suspension (enregistré uniquement dans l'audit, non persisté sur le compte).",
    example: "Compte compromis — demande support",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return value;
  })
  @IsString()
  @MaxLength(500)
  suspensionReason?: string;

  @ApiPropertyOptional({ example: "Awa" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: "Diallo" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      "URL publique de la photo de profil ; null (ou chaîne vide) pour effacer.",
    example: "https://example.com/storage/avatars/user-1.jpg",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    return value;
  })
  @ValidateIf((o) => o.avatarUrl !== null && o.avatarUrl !== undefined)
  @IsString()
  @MaxLength(2048)
  @Matches(/^https?:\/\//, {
    message: "L'avatar doit être une URL http(s) valide.",
  })
  avatarUrl?: string | null;

  /** ADMIN — profil équipe */
  @ApiPropertyOptional({
    enum: AdminLevel,
    description: "Réservé aux comptes ADMIN avec `AdminProfile`.",
  })
  @IsOptional()
  @IsEnum(AdminLevel)
  adminLevel?: AdminLevel;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: "Service / département ; null pour effacer.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string") return value.trim() || null;
    return value;
  })
  @IsString()
  @MaxLength(120)
  department?: string | null;
}
