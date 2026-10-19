import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { PaginationMetaSchemaDto } from "../../common/dto/pagination-response.dto";

export class AnnonceSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: "Titre de l’annonce." })
  title: string;

  @ApiProperty({ description: "Description détaillée." })
  description: string;

  @ApiProperty({
    type: [String],
    description: "URLs des images associées.",
  })
  imageUrls: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/** Schéma public (latest-unread). */
export class AnnoncePublicSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: "Titre de l’annonce." })
  title: string;

  @ApiProperty({ description: "Description détaillée." })
  description: string;

  @ApiProperty({
    type: [String],
    description: "URLs des images associées.",
  })
  imageUrls: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

@ApiExtraModels(AnnonceSchemaDto)
export class AnnonceResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: AnnonceSchemaDto })
  data: AnnonceSchemaDto;
}

@ApiExtraModels(AnnoncePublicSchemaDto)
export class AnnonceLatestUnreadResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({
    type: AnnoncePublicSchemaDto,
    nullable: true,
    description: "Dernière annonce non lue, ou `null` s’il n’y en a aucune.",
  })
  data: AnnoncePublicSchemaDto | null;
}

@ApiExtraModels(AnnonceSchemaDto, PaginationMetaSchemaDto)
export class AnnoncesPaginatedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [AnnonceSchemaDto] })
  data: AnnonceSchemaDto[];

  @ApiProperty({ type: PaginationMetaSchemaDto })
  pagination: PaginationMetaSchemaDto;
}
