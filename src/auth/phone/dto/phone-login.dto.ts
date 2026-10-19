import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { AUTH_SECRET_CODE_MIN_LENGTH } from "../../shared/auth-validation.constants";
import { PhoneNumberDto } from "./phone-number.dto";

/** Connexion téléphone + code PIN. */
export class PhoneLoginDto extends PhoneNumberDto {
  @ApiProperty({
    name: "secret_code",
    example: "1234",
    minLength: AUTH_SECRET_CODE_MIN_LENGTH,
    maxLength: 128,
    description: "Code PIN / mot de passe du compte.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(AUTH_SECRET_CODE_MIN_LENGTH)
  @MaxLength(128)
  secret_code: string;
}
