import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

export class SubscribeNewsletterDto {
  @ApiProperty({
    type: String,
    example: "user@example.com",
    description: "Adresse e-mail à inscrire à la newsletter.",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;
}
