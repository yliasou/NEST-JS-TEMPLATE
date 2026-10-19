import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { PaginationMetaSchemaDto } from "../../../common/dto/pagination-response.dto";
import { AuditAction, AuditEntity } from "@prisma/client";

export class AuditLogUserSchemaDto {
  @ApiProperty({ example: "cmadmin001xxxxxxxxxxxxxx" })
  id: string;

  @ApiProperty({ required: false, nullable: true, example: "Ylias" })
  firstName: string | null;

  @ApiProperty({ required: false, nullable: true, example: "Admin" })
  lastName: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "admin@app.local",
  })
  email: string | null;
}

export class AuditLogSchemaDto {
  @ApiProperty({ example: "cmaudit001xxxxxxxxxxxxxx" })
  id: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "cmadmin001xxxxxxxxxxxxxx",
  })
  actorUserId: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "cmuser001xxxxxxxxxxxxxxx",
  })
  targetUserId: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: AuditLogUserSchemaDto,
    description: "Profil de l'utilisateur auteur de l'action.",
  })
  actor: AuditLogUserSchemaDto | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: AuditLogUserSchemaDto,
    description: "Profil de l'utilisateur cible de l'action.",
  })
  target: AuditLogUserSchemaDto | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "req-7f3a2b1c-9d8e-4f5a-b6c7-d8e9f0a1b2c3",
  })
  requestId: string | null;

  @ApiProperty({ enum: AuditAction, example: AuditAction.AUTH_LOGIN })
  action: AuditAction;

  @ApiProperty({
    enum: AuditEntity,
    required: false,
    nullable: true,
    example: AuditEntity.USER,
  })
  entity: AuditEntity | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "cmuser001xxxxxxxxxxxxxxx",
  })
  entityId: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description: "Données contextuelles variables selon `action` / `entity`.",
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ required: false, nullable: true, example: "196.168.1.42" })
  ip: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 4.0511,
    description: "Latitude GPS envoyée par l'application cliente.",
  })
  latitude: number | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 9.7679,
    description: "Longitude GPS envoyée par l'application cliente.",
  })
  longitude: number | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 12,
    description: "Précision GPS en mètres, si fournie par l'appareil.",
  })
  locationAccuracy: number | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "2026-07-16T17:16:00.000Z",
    description: "Date de capture de la position côté client.",
  })
  locationCapturedAt: Date | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
  })
  userAgent: string | null;

  @ApiProperty({ example: "2026-05-22T08:15:00.000Z" })
  createdAt: Date;
}

@ApiExtraModels(
  AuditLogUserSchemaDto,
  AuditLogSchemaDto,
  PaginationMetaSchemaDto,
)
export class AuditLogsPaginatedResponseSchemaDto {
  @ApiProperty({ example: true })
  success: true;

  @ApiProperty({ example: "Logs d'audit récupérés avec succès" })
  message: string;

  @ApiProperty({ type: [AuditLogSchemaDto] })
  data: AuditLogSchemaDto[];

  @ApiProperty({ type: PaginationMetaSchemaDto })
  pagination: PaginationMetaSchemaDto;
}
