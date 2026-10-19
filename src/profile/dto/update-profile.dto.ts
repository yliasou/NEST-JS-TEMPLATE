import { ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    type: String,
    example: "Ylias",
    description:
      "Prénom. Peut être envoyé seul ou avec lastName. Si firstName/lastName sont envoyés, le champ name est ignoré.",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({
    type: String,
    example: "Gadie",
    description:
      "Nom. Peut être envoyé seul ou avec firstName. Si firstName/lastName sont envoyés, le champ name est ignoré.",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({
    example: "Ylias Gadie",
    description:
      "Prénom et nom dans une seule chaîne (rétrocompat). Ignoré si firstName ou lastName est fourni.",
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: "user@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      "URL publique de la photo de profil (ex. retour du service d’upload). Chaîne vide pour retirer l’avatar.",
    example: "https://example.com/storage/avatars/user-1.jpg",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;

  @ApiPropertyOptional({
    type: String,
    format: "date",
    nullable: true,
    example: "1990-05-15",
    description: "Date de naissance (ISO 8601). Envoyer `null` pour effacer.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (typeof value === "string") return value.trim();
    return value;
  })
  @ValidateIf((o) => o.dateOfBirth !== null && o.dateOfBirth !== undefined)
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({
    enum: Gender,
    nullable: true,
    example: Gender.FEMALE,
    description: "Genre. Envoyer `null` pour effacer.",
  })
  @IsOptional()
  @ValidateIf((o) => o.gender !== null && o.gender !== undefined)
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "12 rue de la Paix, Paris",
    description:
      "Adresse résidentielle. Envoyer `null` ou une chaîne vide pour effacer.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (typeof value === "string") return value.trim();
    return value;
  })
  @ValidateIf(
    (o) => o.residentialAddress !== null && o.residentialAddress !== undefined,
  )
  @IsString()
  @MaxLength(500)
  residentialAddress?: string | null;
}
