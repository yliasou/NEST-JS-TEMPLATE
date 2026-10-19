import { Module } from "@nestjs/common";
import { AppCacheModule } from "../cache/cache.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminNewsletterController } from "./admin-newsletter.controller";
import { NewsletterController } from "./newsletter.controller";
import { NewsletterService } from "./newsletter.service";
import { NewsletterCacheService } from "./services/newsletter-cache.service";
import { NewsletterReadService } from "./services/newsletter-read.service";
import { NewsletterValidationService } from "./services/newsletter-validation.service";
import { NewsletterWriteService } from "./services/newsletter-write.service";

@Module({
  imports: [PrismaModule, AppCacheModule],
  controllers: [NewsletterController, AdminNewsletterController],
  providers: [
    NewsletterCacheService,
    NewsletterService,
    NewsletterReadService,
    NewsletterWriteService,
    NewsletterValidationService,
  ],
  exports: [NewsletterService],
})
export class NewsletterModule {}
