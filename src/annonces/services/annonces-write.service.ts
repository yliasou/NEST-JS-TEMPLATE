import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { translate, type Locale } from "../../common/i18n";
import { validationErrorResponse } from "../../common/utils/response.util";
import { PrismaService } from "../../prisma/prisma.service";
import { bumpAnnoncesCacheGeneration } from "../config/annonces-cache.config";
import { ANNONCE_SELECT } from "../constants/annonce-select";
import type { CreateAnnonceDto } from "../dto/create-annonce.dto";
import type { UpdateAnnonceDto } from "../dto/update-annonce.dto";
import { AnnoncesValidationService } from "./annonces-validation.service";

@Injectable()
export class AnnoncesWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly annoncesValidation: AnnoncesValidationService,
  ) {}

  async create(dto: CreateAnnonceDto) {
    const annonce = await this.prisma.annonce.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrls: dto.imageUrls,
        isActive: dto.isActive ?? true,
      },
      select: ANNONCE_SELECT,
    });
    bumpAnnoncesCacheGeneration();
    return { ...annonce, imageUrls: annonce.imageUrls ?? [] };
  }

  async update(id: string, dto: UpdateAnnonceDto, locale: Locale) {
    const hasAnyField = Object.values(dto).some((value) => value !== undefined);
    if (!hasAnyField) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "annonceUpdateEmpty")],
          translate(locale, "validationSummary"),
          locale,
        ),
      );
    }

    await this.annoncesValidation.ensureExists(id, locale);

    const annonce = await this.prisma.annonce.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrls !== undefined && { imageUrls: dto.imageUrls }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: ANNONCE_SELECT,
    });
    bumpAnnoncesCacheGeneration();
    return { ...annonce, imageUrls: annonce.imageUrls ?? [] };
  }
}
