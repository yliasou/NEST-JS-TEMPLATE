import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { Gender, Platform } from "@prisma/client";

class ProfileUserSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: "user@example.com",
  })
  email: string | null;

  @ApiProperty({ type: String, nullable: true, example: "+33612345678" })
  phone: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "Photo de profil.",
    example: "https://example.com/avatar.jpg",
  })
  avatarUrl: string | null;

  @ApiProperty({ type: String, example: "Marie" })
  firstName: string;

  @ApiProperty({ type: String, example: "Dupont" })
  lastName: string;

  @ApiProperty({
    type: String,
    example: "Marie Dupont",
    description: "Prénom et nom concaténés (affichage).",
  })
  name: string;

  @ApiProperty({
    enum: ["USER", "ADMIN"],
  })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

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

  @ApiProperty({
    type: Number,
    example: 3,
    description:
      "Nombre de notifications non lues (badge), indépendant des filtres de la liste.",
  })
  unreadNotificationsCount: number;
}

@ApiExtraModels(ProfileUserSchemaDto)
export class ProfileMeResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Profil récupéré avec succès" })
  message: string;

  @ApiProperty({ type: ProfileUserSchemaDto })
  data: ProfileUserSchemaDto;
}

class PushTokenSchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" })
  token: string;

  @ApiProperty({ enum: Platform, example: Platform.IOS })
  platform: Platform;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

@ApiExtraModels(PushTokenSchemaDto)
export class PushTokenResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Token de notification enregistré avec succès" })
  message: string;

  @ApiProperty({ type: PushTokenSchemaDto })
  data: PushTokenSchemaDto;
}
