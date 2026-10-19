import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";

class VerifyCodeDataSchemaDto {
  @ApiProperty({
    name: "request_type",
    enum: AuthVerifyFlow,
    description:
      "Type de requête en cours : NEW_ACCOUNT, EXISTING_ACCOUNT ou PASSWORD_RESET.",
  })
  request_type: AuthVerifyFlow;

  @ApiPropertyOptional({
    name: "security",
    description:
      "Jeton pour register (NEW_ACCOUNT) ou change-password (PASSWORD_RESET). Absent pour EXISTING_ACCOUNT (connexion via POST /auth/phone/login).",
  })
  security?: string;
}

export class VerifyCodeResponseSchemaDto {
  @ApiProperty()
  success: true;

  @ApiProperty({ example: "Code vérifié" })
  message: string;

  @ApiProperty({ type: VerifyCodeDataSchemaDto })
  data: VerifyCodeDataSchemaDto;
}
