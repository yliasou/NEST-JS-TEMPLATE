import { ApiPropertyOptional } from "@nestjs/swagger";
import { AdminLevel, Role } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/** Query liste paginée des utilisateurs. */
export class UsersQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: "Numéro de page (≥ 1).",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: "Taille de page (1–50).",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  per_page?: number;

  @ApiPropertyOptional({
    description:
      "Recherche libre : e-mail, téléphone, prénom ou nom (contient, insensible à la casse).",
    example: "+33612345678",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  search?: string;

  @ApiPropertyOptional({
    description: "Filtrer par statut actif (`true` / `false`).",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: Role,
    description: "Filtrer par rôle utilisateur.",
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    enum: AdminLevel,
    description: "Filtrer par niveau hiérarchique (profil admin).",
  })
  @IsOptional()
  @IsEnum(AdminLevel)
  level?: AdminLevel;
}
