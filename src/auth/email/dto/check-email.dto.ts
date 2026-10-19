import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CheckEmailDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Adresse e-mail à vérifier (déjà enregistrée ou non).",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

class CheckEmailDataSchemaDto {
  @ApiProperty({
    example: "user@example.com",
    description: "E-mail normalisé (minuscules, trim).",
  })
  email!: string;

  @ApiProperty({
    example: true,
    description: "`true` si un compte utilise déjà cet e-mail.",
  })
  exists!: boolean;
}

/** Réponse GET /auth/check-email */
export class CheckEmailResponseSchemaDto {
  @ApiProperty()
  success!: true;

  @ApiProperty({ example: "Cette adresse e-mail est déjà utilisée." })
  message!: string;

  @ApiProperty({ type: CheckEmailDataSchemaDto })
  data!: CheckEmailDataSchemaDto;
}
