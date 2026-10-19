import { NotificationType, Prisma } from "@prisma/client";
import { PaginationMetaSchemaDto } from "../../../common/dto/pagination-response.dto";
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import {
  NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
  NOTIFICATION_METADATA_SWAGGER_EXAMPLES,
} from "./notification-metadata.swagger-examples";

export class NotificationSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    description: NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
    examples: NOTIFICATION_METADATA_SWAGGER_EXAMPLES,
  })
  metadata: Prisma.JsonValue | null;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional({ type: Date, nullable: true })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

@ApiExtraModels(NotificationSchemaDto)
export class NotificationResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: NotificationSchemaDto })
  data: NotificationSchemaDto;
}

@ApiExtraModels(NotificationSchemaDto, PaginationMetaSchemaDto)
export class NotificationsPaginatedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [NotificationSchemaDto] })
  data: NotificationSchemaDto[];

  @ApiProperty({
    type: Number,
    example: 12,
    description:
      "Nombre de notifications non lues (badge), indépendant des filtres de la page.",
  })
  count: number;

  @ApiProperty({ type: PaginationMetaSchemaDto })
  pagination: PaginationMetaSchemaDto;
}

export class MarkAllNotificationsReadSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({
    type: Object,
    example: { updatedCount: 3 },
  })
  data: {
    updatedCount: number;
  };
}
