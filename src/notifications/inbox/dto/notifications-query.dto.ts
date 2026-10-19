import { NotificationType } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class NotificationsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: "Numéro de page (>= 1).",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: "Taille de page (1-50).",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  per_page?: number;

  @ApiPropertyOptional({
    description: "Filtrer par statut lu (`true` / `false`).",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return undefined;
  })
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    enum: NotificationType,
    description: "Filtrer par type de notification.",
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
