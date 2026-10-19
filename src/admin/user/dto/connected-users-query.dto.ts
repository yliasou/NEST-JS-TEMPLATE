import { ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

/** Filtres optionnels pour le compteur d'utilisateurs connectés. */
export class ConnectedUsersQueryDto {
  @ApiPropertyOptional({
    description: "Filtrer par rôle utilisateur.",
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
