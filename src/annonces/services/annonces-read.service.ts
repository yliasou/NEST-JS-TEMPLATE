import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Role } from "@prisma/client";
import { translate, type Locale } from "../../common/i18n";
import { PrismaService } from "../../prisma/prisma.service";
import { buildAnnoncesCacheKey } from "../config/annonces-cache.config";
import {
  ANNONCE_PUBLIC_SELECT,
  ANNONCE_SELECT,
} from "../constants/annonce-select";
import { seesInactiveAnnonces } from "../constants/annonce-visibility.util";
import type { AnnoncesQueryDto } from "../dto/annonces-query.dto";
import { AnnoncesCacheService } from "./annonces-cache.service";

@Injectable()
export class AnnoncesReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly annoncesCache: AnnoncesCacheService,
  ) {}

  async findAll(query: AnnoncesQueryDto) {
    const key = buildAnnoncesCacheKey("annonces-list", {
      page: query.page,
      per_page: query.per_page,
      search: query.search,
      isActive: query.isActive,
    });
    return this.annoncesCache.wrap(key, () => this.computeFindAll(query));
  }

  async findLatestUnread(userId: string) {
    const key = buildAnnoncesCacheKey("annonce-latest-unread", { userId });
    return this.annoncesCache.wrap(key, () =>
      this.computeFindLatestUnread(userId),
    );
  }

  private async computeFindLatestUnread(userId: string) {
    const annonce = await this.prisma.annonce.findFirst({
      where: {
        isActive: true,
        reads: { none: { userId } },
      },
      select: ANNONCE_PUBLIC_SELECT,
      orderBy: [{ createdAt: "desc" }],
    });
    if (!annonce) {
      return null;
    }
    return { ...annonce, imageUrls: annonce.imageUrls ?? [] };
  }

  private async computeFindAll(query: AnnoncesQueryDto) {
    const page = query.page ?? 1;
    const perPage = Math.min(Math.max(1, query.per_page ?? 10), 50);

    const where: Prisma.AnnonceWhereInput = {};
    if (query.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        },
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const totalItems = await this.prisma.annonce.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const data = await this.prisma.annonce.findMany({
      where,
      select: ANNONCE_SELECT,
      orderBy: [{ createdAt: "desc" }],
      skip: offset,
      take: perPage,
    });

    return {
      data: data.map((row) => ({ ...row, imageUrls: row.imageUrls ?? [] })),
      pagination: {
        current_page: safePage,
        total_pages: totalPages,
        per_page: perPage,
        total_items: totalItems,
      },
    };
  }

  async findOne(id: string, locale: Locale, role?: Role) {
    const key = buildAnnoncesCacheKey("annonce-detail", { id });
    const annonce = await this.annoncesCache.wrap(key, () =>
      this.computeFindOne(id, locale),
    );
    if (!seesInactiveAnnonces(role) && !annonce.isActive) {
      throw new NotFoundException(translate(locale, "annonceNotFound"));
    }
    return annonce;
  }

  private async computeFindOne(id: string, locale: Locale) {
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
      select: ANNONCE_SELECT,
    });
    if (!annonce) {
      throw new NotFoundException(translate(locale, "annonceNotFound"));
    }
    return { ...annonce, imageUrls: annonce.imageUrls ?? [] };
  }
}
