import { Module } from "@nestjs/common";
import { AuditTrailsModule } from "../audit-trails/audit-trails.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
  imports: [PrismaModule, AuditTrailsModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
