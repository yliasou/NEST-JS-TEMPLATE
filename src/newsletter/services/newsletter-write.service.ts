import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { translate, type Locale } from "../../common/i18n";
import { validationErrorResponse } from "../../common/utils/response.util";
import { PrismaService } from "../../prisma/prisma.service";
import { bumpNewsletterCacheGeneration } from "../config/newsletter-cache.config";
import { NEWSLETTER_SUBSCRIBER_SELECT } from "../constants/newsletter-select";
import type { SubscribeNewsletterDto } from "../dto/subscribe-newsletter.dto";
import type { UpdateNewsletterSubscriberDto } from "../dto/update-newsletter-subscriber.dto";
import { NewsletterValidationService } from "./newsletter-validation.service";

@Injectable()
export class NewsletterWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly newsletterValidation: NewsletterValidationService,
  ) {}

  async subscribe(
    dto: SubscribeNewsletterDto,
    locale: Locale,
    userId?: string,
  ) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: NEWSLETTER_SUBSCRIBER_SELECT,
    });

    if (existing) {
      if (existing.isActive) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "newsletterEmailAlreadySubscribed")],
            translate(locale, "validationSummary"),
            locale,
          ),
        );
      }

      const reactivated = await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          isActive: true,
          ...(userId && { userId }),
        },
        select: NEWSLETTER_SUBSCRIBER_SELECT,
      });
      bumpNewsletterCacheGeneration();
      return reactivated;
    }

    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: {
        email,
        ...(userId && { userId }),
      },
      select: NEWSLETTER_SUBSCRIBER_SELECT,
    });
    bumpNewsletterCacheGeneration();
    return subscriber;
  }

  async updateSubscriber(
    id: string,
    dto: UpdateNewsletterSubscriberDto,
    locale: Locale,
  ) {
    const hasAnyField = Object.values(dto).some((value) => value !== undefined);
    if (!hasAnyField) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "newsletterSubscriberUpdateEmpty")],
          translate(locale, "validationSummary"),
          locale,
        ),
      );
    }

    await this.newsletterValidation.ensureSubscriberExists(id, locale);

    const subscriber = await this.prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: NEWSLETTER_SUBSCRIBER_SELECT,
    });
    bumpNewsletterCacheGeneration();
    return subscriber;
  }
}
