import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, Matches, ValidateIf } from "class-validator";
import { AUTH_OTP_CODE_LENGTH } from "../../../auth/shared/auth-validation.constants";

export class SetPermanentOtpDto {
  @ApiPropertyOptional({
    nullable: true,
    example: "4821",
    description: `Code OTP permanent de ${AUTH_OTP_CODE_LENGTH} chiffres. null ou omis pour le retirer. Il n'est plus renvoyé ensuite.`,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(new RegExp(`^\\d{${AUTH_OTP_CODE_LENGTH}}$`), {
    message: `Le code doit contenir ${AUTH_OTP_CODE_LENGTH} chiffres.`,
  })
  code?: string | null;
}
