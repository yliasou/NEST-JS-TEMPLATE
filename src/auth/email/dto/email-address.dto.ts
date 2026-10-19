import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

/** Adresse e-mail normalisée (minuscules) : forgot-password (parcours e-mail). */
export class EmailAddressDto {
  @ApiProperty({ example: "user@example.com" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
