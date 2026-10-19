import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";
import { ACCESS_TEMPLATE_IDS } from "../constants/permission-templates";

export class ApplyAccessTemplateDto {
  @ApiProperty({
    enum: ACCESS_TEMPLATE_IDS,
    example: "USER_MANAGER",
    description: `Modèle de base : ${ACCESS_TEMPLATE_IDS.join(" | ")}.`,
  })
  @IsString()
  @IsIn([...ACCESS_TEMPLATE_IDS])
  templateId!: string;
}
