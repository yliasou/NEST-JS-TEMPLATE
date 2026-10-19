import { NotificationType, Prisma } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
  NOTIFICATION_METADATA_SWAGGER_EXAMPLES,
} from "./notification-metadata.swagger-examples";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    example: NotificationType.SYSTEM,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    type: String,
    maxLength: 500,
    example: "Votre export est prêt.",
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    description: NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
    examples: NOTIFICATION_METADATA_SWAGGER_EXAMPLES,
  })
  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonValue;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: "Si true, readAt est positionné à now ; sinon remis à null.",
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
