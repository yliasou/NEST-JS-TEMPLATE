import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { PaginationMetaSchemaDto } from "../../common/dto/pagination-response.dto";

export class ExampleSchemaDto {
  @ApiProperty({ example: "clexamplexxxxxxxxxxxxxxx" })
  id: string;

  @ApiProperty({ example: "Premier exemple" })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  createdById: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

@ApiExtraModels(ExampleSchemaDto)
export class ExampleResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: ExampleSchemaDto })
  data: ExampleSchemaDto;
}

@ApiExtraModels(ExampleSchemaDto, PaginationMetaSchemaDto)
export class ExamplesPaginatedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [ExampleSchemaDto] })
  data: ExampleSchemaDto[];

  @ApiProperty({ type: PaginationMetaSchemaDto })
  pagination: PaginationMetaSchemaDto;
}
