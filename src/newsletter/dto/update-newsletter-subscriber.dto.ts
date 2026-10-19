import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateNewsletterSubscriberDto {
  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: "false = désinscription (e-mail conservé pour historique).",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
