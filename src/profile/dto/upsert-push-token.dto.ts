import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Platform } from "@prisma/client";

export class UpsertPushTokenDto {
  @ApiProperty({
    type: String,
    example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    description:
      "Push notification token issued by the device / notification provider.",
    maxLength: 512,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @ApiProperty({
    enum: Platform,
    example: Platform.IOS,
    description: "Mobile platform that generated the token.",
  })
  @IsEnum(Platform)
  platform: Platform;
}
