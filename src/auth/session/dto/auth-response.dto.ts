import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { Gender } from "@prisma/client";

class AuthUserSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "E-mail du compte.",
    example: "user@example.com",
  })
  email: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "Téléphone du compte.",
    example: "+33612345678",
  })
  phone: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "Photo de profil.",
    example: "https://example.com/avatar.jpg",
  })
  avatarUrl: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ["USER", "ADMIN"] })
  role: string;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ["ADMIN", "EMPLOYEE", "SUPPORT"],
    description: "Niveau admin si `role = ADMIN`, sinon `null`.",
  })
  adminLevel: string | null;

  @ApiProperty({
    description:
      "E-mail vérifié par code (parcours e-mail : POST /auth/email/verify).",
  })
  emailVerified: boolean;

  @ApiProperty({ description: "Téléphone vérifié par OTP SMS." })
  phoneVerified: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    format: "date-time",
    example: "1990-05-15T00:00:00.000Z",
  })
  dateOfBirth: string | null;

  @ApiProperty({ enum: Gender, nullable: true, example: Gender.MALE })
  gender: Gender | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: "12 rue de la Paix, Paris",
  })
  residentialAddress: string | null;
}

export class AuthDataSchemaDto {
  @ApiProperty({ name: "access_token" })
  access_token: string;

  @ApiProperty({ name: "refresh_token" })
  refresh_token: string;

  @ApiProperty({ type: AuthUserSchemaDto })
  user: AuthUserSchemaDto;
}

class AuthRefreshDataSchemaDto {
  @ApiProperty({ name: "access_token" })
  access_token: string;

  @ApiProperty({ name: "refresh_token" })
  refresh_token: string;
}

@ApiExtraModels(AuthUserSchemaDto, AuthDataSchemaDto, AuthRefreshDataSchemaDto)
export class AuthRegisterLoginResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Connexion réussie" })
  message: string;

  @ApiProperty({ type: AuthDataSchemaDto })
  data: AuthDataSchemaDto;
}

export class AuthRefreshResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Tokens renouvelés" })
  message: string;

  @ApiProperty({ type: AuthRefreshDataSchemaDto })
  data: AuthRefreshDataSchemaDto;
}
