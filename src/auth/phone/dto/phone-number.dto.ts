import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { normalizePhoneInput } from "../utils/phone-normalize.util";

/** Numéro E.164 : send-code, forgot-password (parcours téléphone). */
export class PhoneNumberDto {
  @ApiProperty({
    name: "phone_number",
    example: "+2250707070707",
    description:
      "Numéro au format international E.164 avec indicatif pays obligatoire.",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? normalizePhoneInput(value) : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^\+[0-9]{8,20}$/, {
    message: "Le numéro doit inclure l'indicatif pays (ex. +2250707070707).",
  })
  phone_number: string;
}
