import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { resolveUserSearchTerm } from "../../../auth/phone/utils/phone-normalize.util";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { recentFirstOrderBy } from "../../../common/utils/recent-first-order";
import { buildAdminUsersCacheKey } from "../config/admin-users-cache.config";
import { getConnectedUsersWithinMinutes } from "../../../auth/session/config/jwt-expiry.config";
import type { ConnectedUsersQueryDto } from "../dto/connected-users-query.dto";
import type { UsersQueryDto } from "../dto/users-query.dto";
import { AdminUsersCacheService } from "./admin-users-cache.service";
import {
  CONNECTED_USER_SELECT,
  normalizeConnectedUser,
  normalizeUserAdmin,
  USER_ADMIN_SELECT,
  type ConnectedUserRow,
  type UserAdminRow,
} from "./user-admin.select";

/** Plafond liste connectés (fenêtre 15 min — volume typiquement faible). */
const MAX_CONNECTED_USERS_LIST = 200;

@Injectable()
export class UsersListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminUsersCache: AdminUsersCacheService,
  ) {}

  async findAll(query: UsersQueryDto) {
    const key = buildAdminUsersCacheKey("admin-users-list", {
      page: query.page,
      per_page: query.per_page,
      search: query.search,
      isActive: query.isActive,
      role: query.role,
      level: query.level,
    });
    return this.adminUsersCache.wrap(key, () => this.computeFindAll(query));
  }

  private async computeFindAll(query: UsersQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 10;

    const where: Prisma.UserWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.role !== undefined) {
      where.role = query.role;
    }

    if (query.level !== undefined) {
      where.adminProfile = { is: { level: query.level } };
    }

    if (query.search) {
      const s = resolveUserSearchTerm(query.search);
      where.AND = [
        {
          OR: [
            { id: { contains: s, mode: "insensitive" } },
            { email: { contains: s, mode: "insensitive" } },
            { phone: { contains: s, mode: "insensitive" } },
            {
              profile: {
                is: {
                  OR: [
                    { firstName: { contains: s, mode: "insensitive" } },
                    { lastName: { contains: s, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const totalItems = await this.prisma.user.count({ where });
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * perPage;

    const rows = await this.prisma.user.findMany({
      where,
      select: USER_ADMIN_SELECT,
      orderBy: recentFirstOrderBy,
      skip: offset,
      take: perPage,
    });

    const data = rows.map((u) => normalizeUserAdmin(u as UserAdminRow));

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

  async countConnected(query: ConnectedUsersQueryDto) {
    const withinMinutes = getConnectedUsersWithinMinutes();
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);

    const where: Prisma.UserWhereInput = {
      isActive: true,
      deletedAt: null,
      lastRequestAt: { gte: since },
      ...(query.role ? { role: query.role } : {}),
    };

    const [connectedCount, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: CONNECTED_USER_SELECT,
        orderBy: { lastRequestAt: "desc" },
        take: MAX_CONNECTED_USERS_LIST,
      }),
    ]);

    return {
      connectedCount,
      since: since.toISOString(),
      withinMinutes,
      users: rows.map((u) => normalizeConnectedUser(u as ConnectedUserRow)),
    };
  }

  async findOne(id: string, locale: Locale) {
    const key = buildAdminUsersCacheKey("admin-user-detail", { id });
    return this.adminUsersCache.wrap(key, () =>
      this.computeFindOne(id, locale),
    );
  }

  private async computeFindOne(id: string, locale: Locale) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_ADMIN_SELECT,
    });
    if (!user) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }
    return normalizeUserAdmin(user as UserAdminRow);
  }
}
