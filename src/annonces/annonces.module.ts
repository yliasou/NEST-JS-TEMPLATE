import { Module } from "@nestjs/common";
import { AppCacheModule } from "../cache/cache.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAnnoncesController } from "./admin-annonces.controller";
import { AnnoncesController } from "./annonces.controller";
import { AnnoncesService } from "./annonces.service";
import { AnnoncesCacheService } from "./services/annonces-cache.service";
import { AnnoncesReadStateService } from "./services/annonces-read-state.service";
import { AnnoncesReadService } from "./services/annonces-read.service";
import { AnnoncesValidationService } from "./services/annonces-validation.service";
import { AnnoncesWriteService } from "./services/annonces-write.service";

@Module({
  imports: [PrismaModule, AppCacheModule],
  controllers: [AnnoncesController, AdminAnnoncesController],
  providers: [
    AnnoncesCacheService,
    AnnoncesService,
    AnnoncesReadService,
    AnnoncesReadStateService,
    AnnoncesWriteService,
    AnnoncesValidationService,
  ],
  exports: [AnnoncesService],
})
export class AnnoncesModule {}
