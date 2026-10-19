import { Injectable, NotFoundException } from "@nestjs/common";
import { translate, type Locale } from "../../common/i18n";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ExamplesValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureExists(id: string, locale: Locale): Promise<void> {
    const example = await this.prisma.example.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!example) {
      throw new NotFoundException(translate(locale, "exampleNotFound"));
    }
  }
}
