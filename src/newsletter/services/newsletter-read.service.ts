import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { buildNewsletterCacheKey } from "../config/newsletter-cache.config";
import { NEWSLETTER_SUBSCRIBER_SELECT } from "../constants/newsletter-select";
import type { NewsletterSubscribersQueryDto } from "../dto/newsletter-subscribers-query.dto";
import { NewsletterCacheService } from "./newsletter-cache.service";

@Injectable()
export class NewsletterReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly newsletterCache: NewsletterCacheService,
  ) {}

  async findAllSubscribers(query: NewsletterSubscribersQueryDto) {
    const key = buildNewsletterCacheKey("subscribers-list", {
      page: query.page,
      per_page: query.per_page,
      search: query.search,
      isActive: query.isActive,
    });
    return this.newsletterCache.wrap(key, () =>
      this.computeFindAllSubscribers(query),
    );
  }

  private async computeFindAllSubscribers(
    query: NewsletterSubscribersQueryDto,
  ) {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;

    const where: Prisma.NewsletterSubscriberWhereInput = {};
    if (query.search) {
      where.email = { contains: query.search, mode: "insensitive" };
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const totalItems = await this.prisma.newsletterSubscriber.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const data = await this.prisma.newsletterSubscriber.findMany({
      where,
      select: NEWSLETTER_SUBSCRIBER_SELECT,
      orderBy: [{ createdAt: "desc" }],
      skip: offset,
      take: perPage,
    });

    return {
      data,
      pagination: {
        current_page: safePage,
        total_pages: totalPages,
        per_page: perPage,
        total_items: totalItems,
      },
    };
  }
}
