import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import type { TrackAnalyticsEventInput } from "../../shared/audit-trails.types";
import type { AnalyticsEventsQueryDto } from "../dto/analytics-events-query.dto";

@Injectable()
export class AnalyticsEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AnalyticsEventsQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;

    const where: Prisma.AnalyticsEventWhereInput = {};
    if (query.name) where.name = { contains: query.name, mode: "insensitive" };
    if (query.userId) where.userId = query.userId;

    const totalItems = await this.prisma.analyticsEvent.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const data = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

  async track(input: TrackAnalyticsEventInput) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        name: input.name,
        properties: input.properties,
      },
    });
  }
}
