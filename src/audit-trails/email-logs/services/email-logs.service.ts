import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import type { EmailLogsQueryDto } from "../dto/email-logs-query.dto";
import type { TrackEmailLogInput } from "../../shared/audit-trails.types";

@Injectable()
export class EmailLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmailLogsQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;

    const where: Prisma.EmailLogWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.to) where.to = { contains: query.to, mode: "insensitive" };
    if (query.template) where.template = query.template;

    const totalItems = await this.prisma.emailLog.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const data = await this.prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
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

  async track(input: TrackEmailLogInput) {
    return this.prisma.emailLog.create({
      data: {
        userId: input.userId,
        to: input.to,
        subject: input.subject,
        template: input.template,
        status: input.status ?? "SENT",
        entityType: input.entityType,
        entityId: input.entityId,
        providerId: input.providerId,
        error: input.error,
      },
    });
  }
}
