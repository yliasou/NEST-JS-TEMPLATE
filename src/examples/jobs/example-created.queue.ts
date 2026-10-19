import { Inject, Injectable } from "@nestjs/common";
import type IORedis from "ioredis";
import { BULLMQ_CONNECTION, QueueProducer } from "../../jobs";
import {
  EXAMPLE_CREATED_JOB_NAME,
  EXAMPLE_CREATED_QUEUE_NAME,
  type ExampleCreatedJobData,
} from "./example-created.constants";
import { ExampleCreatedProcessor } from "./example-created.processor";

@Injectable()
export class ExampleCreatedQueue extends QueueProducer<ExampleCreatedJobData> {
  constructor(
    @Inject(BULLMQ_CONNECTION) connection: IORedis | null,
    private readonly processor: ExampleCreatedProcessor,
  ) {
    super(connection, EXAMPLE_CREATED_QUEUE_NAME);
  }

  notifyCreator(data: ExampleCreatedJobData): Promise<void> {
    return this.enqueue(EXAMPLE_CREATED_JOB_NAME, data);
  }

  protected runInline(data: ExampleCreatedJobData): Promise<void> {
    return this.processor.process(data);
  }
}
