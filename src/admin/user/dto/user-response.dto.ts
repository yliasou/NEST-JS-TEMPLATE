import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { AdminLevel, Role } from "@prisma/client";
import { PaginationMetaSchemaDto } from "../../../common/dto/pagination-response.dto";

export class AdminProfileSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AdminLevel })
  level: AdminLevel;

  @ApiPropertyOptional({ type: String, nullable: true })
  department: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AdminUserProfileSchemaDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  preferredLanguage: string;
}

export class AdminUserDetailSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({
    description:
      "Le compte a un OTP permanent. Le code lui-même n'est jamais renvoyé.",
  })
  hasPermanentOtp: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  lastLoginAt: Date | null;

  @ApiPropertyOptional({ type: AdminProfileSchemaDto, nullable: true })
  adminProfile: AdminProfileSchemaDto | null;

  @ApiPropertyOptional({ type: AdminUserProfileSchemaDto, nullable: true })
  profile: AdminUserProfileSchemaDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

@ApiExtraModels(
  AdminUserDetailSchemaDto,
  AdminProfileSchemaDto,
  AdminUserProfileSchemaDto,
  PaginationMetaSchemaDto,
)
export class UsersPaginatedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [AdminUserDetailSchemaDto] })
  data: AdminUserDetailSchemaDto[];

  @ApiProperty({ type: PaginationMetaSchemaDto })
  pagination: PaginationMetaSchemaDto;
}

export class ConnectedUserProfileSnippetSchemaDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class ConnectedUserSnippetSchemaDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastLoginAt: Date | null;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: "Dernière requête authentifiée dans la fenêtre de présence.",
  })
  lastRequestAt: Date | null;

  @ApiPropertyOptional({
    type: ConnectedUserProfileSnippetSchemaDto,
    nullable: true,
  })
  profile: ConnectedUserProfileSnippetSchemaDto | null;
}

export class ConnectedUsersCountSchemaDto {
  @ApiProperty({
    description:
      "Nombre d'utilisateurs actifs dont `lastRequestAt` est dans la fenêtre demandée.",
    example: 12,
  })
  connectedCount: number;

  @ApiProperty({
    description: "Début de la fenêtre glissante (ISO 8601).",
    example: "2026-07-01T10:07:00.000Z",
  })
  since: string;

  @ApiProperty({
    description: "Fenêtre appliquée en minutes.",
    example: 15,
  })
  withinMinutes: number;

  @ApiProperty({
    type: [ConnectedUserSnippetSchemaDto],
    description:
      "Liste légère des utilisateurs connectés (tri `lastRequestAt` desc, max 200).",
  })
  users: ConnectedUserSnippetSchemaDto[];
}

@ApiExtraModels(
  AdminUserDetailSchemaDto,
  AdminProfileSchemaDto,
  AdminUserProfileSchemaDto,
  ConnectedUsersCountSchemaDto,
  ConnectedUserSnippetSchemaDto,
  ConnectedUserProfileSnippetSchemaDto,
)
export class UserResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: AdminUserDetailSchemaDto })
  data: AdminUserDetailSchemaDto;
}

@ApiExtraModels(
  ConnectedUsersCountSchemaDto,
  ConnectedUserSnippetSchemaDto,
  ConnectedUserProfileSnippetSchemaDto,
)
export class ConnectedUsersCountResponseSchemaDto {
  @ApiProperty({ example: true })
  success: true;

  @ApiProperty({
    example: "Nombre d'utilisateurs connectés récupéré avec succès",
  })
  message: string;

  @ApiProperty({ type: ConnectedUsersCountSchemaDto })
  data: ConnectedUsersCountSchemaDto;
}
