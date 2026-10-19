import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { EmailAddressDto } from "./email-address.dto";

/** Connexion e-mail + mot de passe. */
export class EmailLoginDto extends EmailAddressDto {
  @ApiProperty({ example: "MotDePasse123", maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
