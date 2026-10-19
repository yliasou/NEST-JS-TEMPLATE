import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";
import { AUTH_OTP_CODE_LENGTH } from "../../shared/auth-validation.constants";

const OTP_LENGTH_MSG = `Le code OTP doit contenir exactement ${AUTH_OTP_CODE_LENGTH} chiffres.`;

export class VerifyCodeDto {
  @ApiProperty({
    name: "security",
    description: "Jeton reçu après send-code, forgot-password ou register.",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  security: string;

  @ApiProperty({
    example: "1234",
    description: `Code reçu par SMS ou e-mail (${AUTH_OTP_CODE_LENGTH} chiffres).`,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().replace(/\s/g, "") : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(AUTH_OTP_CODE_LENGTH, AUTH_OTP_CODE_LENGTH, {
    message: OTP_LENGTH_MSG,
  })
  @Matches(new RegExp(`^[0-9]{${AUTH_OTP_CODE_LENGTH}}$`), {
    message: OTP_LENGTH_MSG,
  })
  code: string;
}
