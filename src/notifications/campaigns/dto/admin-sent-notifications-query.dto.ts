import { ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export enum AdminNotificationSendTarget {
  USER = "user",
  ROLE = "role",
}

export class AdminSentNotificationsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  per_page?: number;

  @ApiPropertyOptional({
    description:
      "Recherche dans le titre ou le message (insensible à la casse).",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  search?: string;

  @ApiPropertyOptional({
    enum: AdminNotificationSendTarget,
    description: "Filtrer par type de ciblage.",
  })
  @IsOptional()
  @IsEnum(AdminNotificationSendTarget)
  target?: AdminNotificationSendTarget;

  @ApiPropertyOptional({ description: "Filtrer par expéditeur (actorUserId)." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  actorUserId?: string;

  @ApiPropertyOptional({
    enum: Role,
    description: "Filtrer les envois ciblant un rôle.",
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: "Envoyées depuis (ISO date)." })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: "Envoyées jusqu’à (ISO date)." })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
