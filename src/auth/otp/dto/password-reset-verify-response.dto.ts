import { ApiProperty } from "@nestjs/swagger";

/** Réponse après réinitialisation du mot de passe (sans nouveaux tokens). */
export class PasswordResetVerifyResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({
    example: "Mot de passe mis à jour. Vous pouvez vous connecter.",
  })
  message: string;
}
