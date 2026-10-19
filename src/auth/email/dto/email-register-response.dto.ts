import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { AuthOtpStartedDataSchemaDto } from "../../otp/dto/auth-otp-started-response.dto";
import { AuthDataSchemaDto } from "../../session/dto/auth-response.dto";

class EmailRegisterDataSchemaDto extends AuthDataSchemaDto {
  @ApiPropertyOptional({
    name: "email_verification",
    type: AuthOtpStartedDataSchemaDto,
    nullable: true,
    description:
      "`security` à envoyer avec le code reçu à `POST /auth/email/verify`. `null` si l'e-mail n'a pas pu être envoyé : utiliser `resend-verification`.",
  })
  email_verification: AuthOtpStartedDataSchemaDto | null;
}

@ApiExtraModels(EmailRegisterDataSchemaDto, AuthOtpStartedDataSchemaDto)
export class EmailRegisterResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Inscription réussie" })
  message: string;

  @ApiProperty({ type: EmailRegisterDataSchemaDto })
  data: EmailRegisterDataSchemaDto;
}

class EmailVerifiedDataSchemaDto {
  @ApiProperty({ name: "email_verified", example: true })
  email_verified: true;
}

@ApiExtraModels(EmailVerifiedDataSchemaDto)
export class EmailVerifiedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Adresse e-mail vérifiée." })
  message: string;

  @ApiProperty({ type: EmailVerifiedDataSchemaDto })
  data: EmailVerifiedDataSchemaDto;
}
