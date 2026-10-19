import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AdminSendNotificationDto {
  @ApiProperty({
    maxLength: 120,
    example: "Nouveauté disponible",
    description:
      "Titre affiché sur la notification push (barre système / bannière).",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiProperty({
    maxLength: 500,
    example: "Message important: mise a jour de l'application.",
    description: "Corps du message (notification in-app et push).",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}
