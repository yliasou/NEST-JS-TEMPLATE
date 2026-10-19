import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { JobLockService } from "../../jobs";
import { ExamplesWriteService } from "../services/examples-write.service";

const INACTIVE_RETENTION_DAYS = 30;

/** Cron multi-instance : `runOncePerSlot` garantit une seule exécution par créneau. */
@Injectable()
export class ExamplesCleanupCron {
  private readonly logger = new Logger(ExamplesCleanupCron.name);

  constructor(
    private readonly jobLock: JobLockService,
    private readonly examplesWrite: ExamplesWriteService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeInactiveExamples(): Promise<void> {
    await this.jobLock.runOncePerSlot("examples-cleanup", async () => {
      const olderThan = new Date(
        Date.now() - INACTIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );
      const count = await this.examplesWrite.purgeInactive(olderThan);
      if (count > 0) {
        this.logger.log(`${count} exemple(s) inactif(s) supprimé(s).`);
      }
    });
  }
}
