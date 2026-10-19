import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  EXAMPLE_NAME_MAX_LENGTH,
  normalizeExampleName,
} from "../utils/example-name.util";

export class CreateExampleDto {
  @ApiProperty({
    example: "Premier exemple",
    maxLength: EXAMPLE_NAME_MAX_LENGTH,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? normalizeExampleName(value) : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(EXAMPLE_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({
    example: "Description libre de l'exemple.",
    maxLength: 2000,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "Par défaut `true`.", example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
