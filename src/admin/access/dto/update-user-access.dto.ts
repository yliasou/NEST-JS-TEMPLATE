import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsObject, IsOptional } from "class-validator";

export class UpdateUserAccessDto {
  @ApiPropertyOptional({
    description:
      "Accorder ou retirer le statut super admin. Réservé aux super admins.",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    description:
      "Map permission → boolean. Seules les clés du catalogue (`GET /admin/access/permissions`) sont acceptées. " +
      "Les clés absentes du patch sont conservées (merge).",
    example: {
      "admin.users.view": true,
      "admin.users.create": true,
      "admin.users.update": true,
      "admin.users.delete": false,
      "marketing.annonces.view": true,
    },
    additionalProperties: { type: "boolean" },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}
