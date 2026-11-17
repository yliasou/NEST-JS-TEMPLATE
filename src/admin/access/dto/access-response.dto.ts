import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ACCESS_TEMPLATE_IDS } from "../constants/permission-templates";

export class UserAccessDataSchemaDto {
  @ApiProperty({ example: "clxuser001" })
  userId!: string;

  @ApiProperty({ example: "ADMIN" })
  role!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "ADMIN",
    description: "Niveau AdminProfile (ADMIN, EMPLOYEE, SUPPORT).",
  })
  adminLevel!: string | null;

  @ApiProperty({
    example: false,
    description: "true si `metadata.access.isSuperAdmin` est explicite.",
  })
  isSuperAdmin!: boolean;

  @ApiProperty({
    example: true,
    description:
      "Toujours false (mode legacy retiré). Conservé pour compatibilité API.",
  })
  legacyFullAccess!: boolean;

  @ApiProperty({
    type: [String],
    example: ["admin.users.view", "marketing.annonces.view"],
    description: "Liste des permissions effectives accordées.",
  })
  permissions!: string[];
}

export class UserAccessResponseSchemaDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({
    example: "Permissions utilisateur récupérées avec succès.",
  })
  message!: string;

  @ApiProperty({ type: UserAccessDataSchemaDto })
  data!: UserAccessDataSchemaDto;
}

export class PermissionCatalogItemSchemaDto {
  @ApiProperty({ example: "admin.users.view" })
  key!: string;

  @ApiProperty({ example: "view" })
  action!: string;
}

export class PermissionCatalogGroupSchemaDto {
  @ApiProperty({ example: "admin" })
  module!: string;

  @ApiProperty({ example: "users" })
  subModule!: string;

  @ApiProperty({ type: [PermissionCatalogItemSchemaDto] })
  permissions!: PermissionCatalogItemSchemaDto[];
}

export class AccessTemplateSummarySchemaDto {
  @ApiProperty({ enum: ACCESS_TEMPLATE_IDS, example: "OPS_MANAGER" })
  id!: string;

  @ApiProperty({ example: "Responsable opérations" })
  label!: string;

  @ApiProperty({
    example: "Consultation et gestion des comptes utilisateurs.",
  })
  description!: string;

  @ApiProperty({ example: false })
  isSuperAdmin!: boolean;

  @ApiProperty({
    type: [String],
    description:
      "Clés de permissions accordées par ce modèle (pour détecter l'état Appliqué côté UI).",
    example: ["admin.users.view", "admin.users.update"],
  })
  permissionKeys!: string[];
}

export class PermissionsCatalogDataSchemaDto {
  @ApiProperty({ type: [PermissionCatalogGroupSchemaDto] })
  catalog!: PermissionCatalogGroupSchemaDto[];

  @ApiProperty({ type: [AccessTemplateSummarySchemaDto] })
  templates!: AccessTemplateSummarySchemaDto[];

  @ApiProperty({
    type: [String],
    description: "Liste plate de toutes les clés de permissions connues.",
    example: ["admin.users.view", "marketing.annonces.view"],
  })
  keys!: string[];
}

export class PermissionsCatalogResponseSchemaDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({
    example: "Catalogue des permissions récupéré avec succès.",
  })
  message!: string;

  @ApiProperty({ type: PermissionsCatalogDataSchemaDto })
  data!: PermissionsCatalogDataSchemaDto;
}
