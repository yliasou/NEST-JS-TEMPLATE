import { Module } from "@nestjs/common";
import { AuditTrailsModule } from "../../audit-trails/audit-trails.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [AuditTrailsModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
