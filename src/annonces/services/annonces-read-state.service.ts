import { Injectable, NotFoundException } from "@nestjs/common";
import type { Role } from "@prisma/client";
import { translate, type Locale } from "../../common/i18n";
import { PrismaService } from "../../prisma/prisma.service";
import { bumpAnnoncesCacheGeneration } from "../config/annonces-cache.config";
import { ANNONCE_SELECT } from "../constants/annonce-select";
import { seesInactiveAnnonces } from "../constants/annonce-visibility.util";

@Injectable()
export class AnnoncesReadStateService {
  constructor(private readonly prisma: PrismaService) {}

  async markAsRead(
    annonceId: string,
    userId: string,
    locale: Locale,
    role?: Role,
  ) {
    const annonce = await this.prisma.annonce.findUnique({
      where: { id: annonceId },
      select: ANNONCE_SELECT,
    });
    if (!annonce || (!seesInactiveAnnonces(role) && !annonce.isActive)) {
      throw new NotFoundException(translate(locale, "annonceNotFound"));
    }

    await this.prisma.annonceRead.upsert({
      where: {
        userId_annonceId: { userId, annonceId },
      },
      create: { userId, annonceId },
      update: { readAt: new Date() },
    });

    bumpAnnoncesCacheGeneration();

    return { ...annonce, imageUrls: annonce.imageUrls ?? [] };
  }
}
