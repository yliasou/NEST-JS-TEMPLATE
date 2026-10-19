import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";

export class AuthOtpStartedDataSchemaDto {
  @ApiProperty({
    name: "request_type",
    enum: AuthVerifyFlow,
    description:
      "Type de requête en cours : NEW_ACCOUNT, EXISTING_ACCOUNT ou PASSWORD_RESET.",
  })
  request_type: AuthVerifyFlow;

  @ApiProperty({
    name: "security",
    description: "Jeton à utiliser avec verify-code.",
  })
  security: string;

  @ApiPropertyOptional({
    name: "otp_code",
    description:
      "Code OTP. Si l'utilisateur a un OTP permanent, c'est ce code qui est renvoyé. Sinon, code à usage unique uniquement si OTP_RETURN_CODE_IN_RESPONSE=true.",
    example: "1234",
  })
  otp_code?: string;
}

/** Réponse après envoi d’un code OTP (send-code, forgot-password, register). */
export class AuthOtpStartedResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Code envoyé" })
  message: string;

  @ApiProperty({ type: AuthOtpStartedDataSchemaDto })
  data: AuthOtpStartedDataSchemaDto;
}
