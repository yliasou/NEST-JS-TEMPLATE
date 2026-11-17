import { Module } from "@nestjs/common";
import { AdminAccessModule } from "../access/access.module";
import { AuditTrailsModule } from "../../audit-trails/audit-trails.module";
import { AppCacheModule } from "../../cache/cache.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { UserController } from "./user.controller";
import { AdminUsersCacheService } from "./services/admin-users-cache.service";
import { UsersCreateService } from "./services/users-create.service";
import { UsersListService } from "./services/users-list.service";
import { UsersService } from "./services/users.service";
import { UsersUpdateService } from "./services/users-update.service";

@Module({
  imports: [PrismaModule, AppCacheModule, AuditTrailsModule, AdminAccessModule],
  controllers: [UserController],
  providers: [
    AdminUsersCacheService,
    UsersListService,
    UsersCreateService,
    UsersUpdateService,
    UsersService,
  ],
})
export class UserModule {}
