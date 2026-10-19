import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

/** Champs de profil communs aux inscriptions téléphone et e-mail. */
export class RegisterProfileDto {
  @ApiProperty({ name: "first_name", example: "Ylias" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  first_name: string;

  @ApiProperty({ name: "last_name", example: "Gadie" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  last_name: string;

  @ApiPropertyOptional({
    name: "date_of_birth",
    type: String,
    format: "date",
    nullable: true,
    example: "1990-05-15",
    description: "Date de naissance (ISO 8601). Optionnel à l’inscription.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (typeof value === "string") return value.trim();
    return value;
  })
  @ValidateIf((o) => o.date_of_birth !== null && o.date_of_birth !== undefined)
  @IsDateString()
  date_of_birth?: string | null;

  @ApiPropertyOptional({
    enum: Gender,
    nullable: true,
    example: Gender.MALE,
    description: "Genre. Optionnel à l’inscription.",
  })
  @IsOptional()
  @ValidateIf((o) => o.gender !== null && o.gender !== undefined)
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({
    name: "residential_address",
    type: String,
    nullable: true,
    example: "12 rue de la Paix, Paris",
    description: "Adresse résidentielle. Optionnelle à l’inscription.",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (typeof value === "string") return value.trim();
    return value;
  })
  @ValidateIf(
    (o) =>
      o.residential_address !== null && o.residential_address !== undefined,
  )
  @IsString()
  @MaxLength(500)
  residential_address?: string | null;
}
