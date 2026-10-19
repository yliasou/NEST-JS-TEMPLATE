import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { NotificationsService } from "../../notifications/notifications.service";
import type { ExampleCreatedJobData } from "./example-created.constants";

/** Logique du job, partagée par le worker BullMQ et le repli inline. */
@Injectable()
export class ExampleCreatedProcessor {
  constructor(private readonly notifications: NotificationsService) {}

  async process(data: ExampleCreatedJobData): Promise<void> {
    await this.notifications.create(data.createdById, {
      type: NotificationType.SYSTEM,
      message: `L'exemple « ${data.name} » a été créé.`,
      metadata: {
        title: "Exemple créé",
        entityType: "Example",
        entityId: data.exampleId,
      },
    });
  }
}
