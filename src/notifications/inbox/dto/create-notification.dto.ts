import { NotificationType, Prisma } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
  NOTIFICATION_METADATA_SWAGGER_EXAMPLES,
} from "./notification-metadata.swagger-examples";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.SYSTEM,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    type: String,
    maxLength: 500,
    example: "Votre export est prêt.",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

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
    default: false,
    example: false,
    description: "Si true, la notification est créée comme déjà lue.",
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
