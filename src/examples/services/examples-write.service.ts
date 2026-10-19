import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { translate, type Locale } from "../../common/i18n";
import { validationErrorResponse } from "../../common/utils/response.util";
import { PrismaService } from "../../prisma/prisma.service";
import { bumpExamplesCacheGeneration } from "../config/examples-cache.config";
import { EXAMPLE_SELECT } from "../constants/example-select";
import type { CreateExampleDto } from "../dto/create-example.dto";
import type { UpdateExampleDto } from "../dto/update-example.dto";
import { ExamplesValidationService } from "./examples-validation.service";

@Injectable()
export class ExamplesWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examplesValidation: ExamplesValidationService,
  ) {}

  async create(dto: CreateExampleDto, actorUserId: string) {
    const example = await this.prisma.example.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        createdById: actorUserId,
      },
      select: EXAMPLE_SELECT,
    });
    bumpExamplesCacheGeneration();
    return example;
  }

  async update(id: string, dto: UpdateExampleDto, locale: Locale) {
    const hasAnyField = Object.values(dto).some((value) => value !== undefined);
    if (!hasAnyField) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "exampleUpdateEmpty")],
          translate(locale, "validationSummary"),
          locale,
        ),
      );
    }

    await this.examplesValidation.ensureExists(id, locale);

    const example = await this.prisma.example.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: EXAMPLE_SELECT,
    });
    bumpExamplesCacheGeneration();
    return example;
  }

  async remove(id: string, locale: Locale): Promise<void> {
    await this.examplesValidation.ensureExists(id, locale);
    await this.prisma.example.delete({ where: { id } });
    bumpExamplesCacheGeneration();
  }

  /** Supprime les exemples inactifs non modifiés depuis `olderThan`. */
  async purgeInactive(olderThan: Date): Promise<number> {
    const { count } = await this.prisma.example.deleteMany({
      where: { isActive: false, updatedAt: { lt: olderThan } },
    });
    if (count > 0) bumpExamplesCacheGeneration();
    return count;
  }
}
