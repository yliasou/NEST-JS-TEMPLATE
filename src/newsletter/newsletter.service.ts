import { Injectable } from "@nestjs/common";
import type { Locale } from "../common/i18n";
import type { NewsletterSubscribersQueryDto } from "./dto/newsletter-subscribers-query.dto";
import type { SubscribeNewsletterDto } from "./dto/subscribe-newsletter.dto";
import type { UpdateNewsletterSubscriberDto } from "./dto/update-newsletter-subscriber.dto";
import { NewsletterReadService } from "./services/newsletter-read.service";
import { NewsletterWriteService } from "./services/newsletter-write.service";

@Injectable()
export class NewsletterService {
  constructor(
    private readonly newsletterRead: NewsletterReadService,
    private readonly newsletterWrite: NewsletterWriteService,
  ) {}

  async findAllSubscribers(query: NewsletterSubscribersQueryDto) {
    return this.newsletterRead.findAllSubscribers(query);
  }

  async subscribe(
    dto: SubscribeNewsletterDto,
    locale: Locale,
    userId?: string,
  ) {
    return this.newsletterWrite.subscribe(dto, locale, userId);
  }

  async updateSubscriber(
    id: string,
    dto: UpdateNewsletterSubscriberDto,
    locale: Locale,
  ) {
    return this.newsletterWrite.updateSubscriber(id, dto, locale);
  }
}
