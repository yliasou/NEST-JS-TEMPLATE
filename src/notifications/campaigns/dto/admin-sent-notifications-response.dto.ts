import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AdminNotificationSendTarget } from "./admin-sent-notifications-query.dto";

class AdminSentByUserSchemaDto {
  @ApiProperty({ example: "cluser01" })
  id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  lastName: string | null;
}

export class AdminSentNotificationItemSchemaDto {
  @ApiProperty({
    description: "Identifiant campagne (`broadcastId` ou `notificationId`).",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({ example: "claudit01" })
  auditLogId: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "Offre spéciale",
  })
  title: string | null;

  @ApiProperty({ example: "Profitez de -20% cette semaine." })
  message: string;

  @ApiProperty({
    enum: AdminNotificationSendTarget,
    example: AdminNotificationSendTarget.ROLE,
  })
  target: AdminNotificationSendTarget;

  @ApiPropertyOptional({ type: String, nullable: true })
  targetUserId: string | null;

  @ApiPropertyOptional({ type: AdminSentByUserSchemaDto, nullable: true })
  targetUser: AdminSentByUserSchemaDto | null;

  @ApiPropertyOptional({ enum: Role, nullable: true })
  targetRole: Role | null;

  @ApiProperty({ example: 42 })
  recipientCount: number;

  @ApiProperty({ example: 30 })
  readCount: number;

  @ApiProperty({ example: 12 })
  unreadCount: number;

  @ApiProperty({ example: "2026-06-30T10:00:00.000Z" })
  sentAt: Date;

  @ApiPropertyOptional({ type: AdminSentByUserSchemaDto, nullable: true })
  sentBy: AdminSentByUserSchemaDto | null;
}

class AdminSentPaginationMetaSchemaDto {
  @ApiProperty({ example: 1 })
  current_page: number;

  @ApiProperty({ example: 3 })
  total_pages: number;

  @ApiProperty({ example: 10 })
  per_page: number;

  @ApiProperty({ example: 25 })
  total_items: number;
}

export class AdminSentNotificationsPaginatedResponseSchemaDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Notifications envoyées récupérées avec succès" })
  message: string;

  @ApiProperty({ type: [AdminSentNotificationItemSchemaDto] })
  data: AdminSentNotificationItemSchemaDto[];

  @ApiProperty({ type: AdminSentPaginationMetaSchemaDto })
  pagination: AdminSentPaginationMetaSchemaDto;
}

export class AdminSentNotificationDetailResponseSchemaDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Détail notification envoyée récupéré avec succès" })
  message: string;

  @ApiProperty({ type: AdminSentNotificationItemSchemaDto })
  data: AdminSentNotificationItemSchemaDto;
}
