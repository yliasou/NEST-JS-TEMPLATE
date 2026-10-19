import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";
import { validationMessage } from "../../common/utils/validation.util";

export class CreateAnnonceDto {
  @ApiProperty({
    type: String,
    example: "Nouvelle fonctionnalité disponible",
    maxLength: 200,
    description: "Titre de l’annonce.",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    type: String,
    example:
      "Découvrez la nouvelle version de l'application et ses améliorations.",
    description: "Description détaillée de l’annonce.",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({
    type: [String],
    example: [
      "https://cdn.example.com/annonces/banner-1.jpg",
      "https://cdn.example.com/annonces/banner-2.jpg",
    ],
    description: "URLs des images (module upload média).",
  })
  @IsArray()
  @ArrayMinSize(1, { message: validationMessage("annonceImageUrlsMin") })
  @ArrayMaxSize(20)
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value
      .map((v) => (typeof v === "string" ? v.trim() : v))
      .filter((v) => typeof v === "string" && v.length > 0);
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsUrl({}, { each: true })
  @MaxLength(2048, { each: true })
  imageUrls: string[];

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
