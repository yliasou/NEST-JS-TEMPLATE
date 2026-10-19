import { ApiPropertyOptional } from "@nestjs/swagger";
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

export class UpdateAnnonceDto {
  @ApiPropertyOptional({
    type: String,
    example: "Nouvelle fonctionnalité disponible",
    maxLength: 200,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    type: String,
    example: "Découvrez la nouvelle version de l'application.",
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["https://cdn.example.com/annonces/banner-1.jpg"],
    description: "Remplace la liste complète des URLs images.",
  })
  @IsOptional()
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
  imageUrls?: string[];

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
