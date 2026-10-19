import { Inject, Injectable } from "@nestjs/common";
import type { Job } from "bullmq";
import type IORedis from "ioredis";
import { BULLMQ_CONNECTION, QueueWorker } from "../../jobs";
import {
  EXAMPLE_CREATED_QUEUE_NAME,
  type ExampleCreatedJobData,
} from "./example-created.constants";
import { ExampleCreatedProcessor } from "./example-created.processor";

@Injectable()
export class ExampleCreatedWorker extends QueueWorker<ExampleCreatedJobData> {
  protected readonly concurrency = 5;

  constructor(
    @Inject(BULLMQ_CONNECTION) connection: IORedis | null,
    private readonly processor: ExampleCreatedProcessor,
  ) {
    super(connection, EXAMPLE_CREATED_QUEUE_NAME);
  }

  protected process(job: Job<ExampleCreatedJobData>): Promise<void> {
    return this.processor.process(job.data);
  }
}
