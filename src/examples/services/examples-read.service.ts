import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { translate, type Locale } from "../../common/i18n";
import { buildPaginationQuery } from "../../common/utils/pagination.util";
import { recentFirstOrderBy } from "../../common/utils/recent-first-order";
import { PrismaService } from "../../prisma/prisma.service";
import { buildExamplesCacheKey } from "../config/examples-cache.config";
import { EXAMPLE_SELECT } from "../constants/example-select";
import type { ExamplesQueryDto } from "../dto/examples-query.dto";
import { ExamplesCacheService } from "./examples-cache.service";

@Injectable()
export class ExamplesReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examplesCache: ExamplesCacheService,
  ) {}

  async findAll(query: ExamplesQueryDto) {
    const key = buildExamplesCacheKey("examples-list", {
      page: query.page,
      per_page: query.per_page,
      search: query.search,
      isActive: query.isActive,
    });
    return this.examplesCache.wrap(key, () => this.computeFindAll(query));
  }

  async findOne(id: string, locale: Locale) {
    const key = buildExamplesCacheKey("example-detail", { id });
    return this.examplesCache.wrap(key, () => this.computeFindOne(id, locale));
  }

  private async computeFindAll(query: ExamplesQueryDto) {
    const where: Prisma.ExampleWhereInput = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const totalItems = await this.prisma.example.count({ where });
    const { skip, perPage, pagination } = buildPaginationQuery(
      totalItems,
      query.page,
      query.per_page,
    );

    const data = await this.prisma.example.findMany({
      where,
      select: EXAMPLE_SELECT,
      orderBy: recentFirstOrderBy,
      skip,
      take: perPage,
    });

    return { data, pagination };
  }

  private async computeFindOne(id: string, locale: Locale) {
    const example = await this.prisma.example.findUnique({
      where: { id },
      select: EXAMPLE_SELECT,
    });
    if (!example) {
      throw new NotFoundException(translate(locale, "exampleNotFound"));
    }
    return example;
  }
}
