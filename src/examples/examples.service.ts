import { Injectable } from "@nestjs/common";
import { AuditActionsService } from "../audit-trails/recorder/services/audit-actions.service";
import type { Locale } from "../common/i18n";
import type { CreateExampleDto } from "./dto/create-example.dto";
import type { ExamplesQueryDto } from "./dto/examples-query.dto";
import type { UpdateExampleDto } from "./dto/update-example.dto";
import { ExampleCreatedQueue } from "./jobs/example-created.queue";
import { ExamplesReadService } from "./services/examples-read.service";
import { ExamplesWriteService } from "./services/examples-write.service";

/** Façade utilisée par le contrôleur : délègue lecture / écriture, puis audit et jobs. */
@Injectable()
export class ExamplesService {
  constructor(
    private readonly examplesRead: ExamplesReadService,
    private readonly examplesWrite: ExamplesWriteService,
    private readonly auditActions: AuditActionsService,
    private readonly exampleCreatedQueue: ExampleCreatedQueue,
  ) {}

  findAll(query: ExamplesQueryDto) {
    return this.examplesRead.findAll(query);
  }

  findOne(id: string, locale: Locale) {
    return this.examplesRead.findOne(id, locale);
  }

  async create(dto: CreateExampleDto, actorUserId: string) {
    const example = await this.examplesWrite.create(dto, actorUserId);
    await this.auditActions.exampleCreated(actorUserId, example.id, {
      name: example.name,
    });
    await this.exampleCreatedQueue.notifyCreator({
      exampleId: example.id,
      name: example.name,
      createdById: actorUserId,
    });
    return example;
  }

  async update(
    id: string,
    dto: UpdateExampleDto,
    locale: Locale,
    actorUserId: string,
  ) {
    const example = await this.examplesWrite.update(id, dto, locale);
    await this.auditActions.exampleUpdated(actorUserId, id, {
      updatedFields: Object.keys(dto).filter(
        (key) => (dto as Record<string, unknown>)[key] !== undefined,
      ),
    });
    return example;
  }

  async remove(id: string, locale: Locale, actorUserId: string) {
    await this.examplesWrite.remove(id, locale);
    await this.auditActions.exampleDeleted(actorUserId, id);
  }
}
