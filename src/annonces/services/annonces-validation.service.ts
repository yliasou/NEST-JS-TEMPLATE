import { Injectable, NotFoundException } from "@nestjs/common";
import { translate, type Locale } from "../../common/i18n";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnnoncesValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureExists(id: string, locale: Locale) {
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!annonce) {
      throw new NotFoundException(translate(locale, "annonceNotFound"));
    }
  }
}
