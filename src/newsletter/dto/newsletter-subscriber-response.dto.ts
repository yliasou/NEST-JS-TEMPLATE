import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { PaginationMetaSchemaDto } from "../../common/dto/pagination-response.dto";

export class NewsletterSubscriberSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ description: "false si désinscrit." })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

@ApiExtraModels(NewsletterSubscriberSchemaDto)
export class NewsletterSubscriberResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: NewsletterSubscriberSchemaDto })
  data: NewsletterSubscriberSchemaDto;
}

@ApiExtraModels(NewsletterSubscriberSchemaDto, PaginationMetaSchemaDto)
export class NewsletterSubscribersPaginatedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [NewsletterSubscriberSchemaDto] })
  data: NewsletterSubscriberSchemaDto[];

  @ApiProperty({ type: PaginationMetaSchemaDto })
  pagination: PaginationMetaSchemaDto;
}
