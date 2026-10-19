import { Module, forwardRef } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuditTrailsModule } from "../../audit-trails/audit-trails.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminAccessController } from "./access.controller";
import { PermissionsGuard } from "./guards/permissions.guard";
import { AdminAccessService } from "./services/admin-access.service";

@Module({
  imports: [PrismaModule, forwardRef(() => AuditTrailsModule)],
  controllers: [AdminAccessController],
  providers: [
    AdminAccessService,
    PermissionsGuard,
    { provide: APP_GUARD, useExisting: PermissionsGuard },
  ],
  exports: [AdminAccessService, PermissionsGuard],
})
export class AdminAccessModule {}
