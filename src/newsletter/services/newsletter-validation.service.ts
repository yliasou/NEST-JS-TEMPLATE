import { Injectable, NotFoundException } from "@nestjs/common";
import { translate, type Locale } from "../../common/i18n";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NewsletterValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSubscriberExists(id: string, locale: Locale) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!subscriber) {
      throw new NotFoundException(
        translate(locale, "newsletterSubscriberNotFound"),
      );
    }
  }
}
