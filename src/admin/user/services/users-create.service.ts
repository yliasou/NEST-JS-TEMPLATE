import * as bcrypt from "bcrypt";
import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AdminLevel, Prisma, Role } from "@prisma/client";
import { AdminAccessService } from "../../access/services/admin-access.service";
import { ADMIN_PERMISSIONS } from "../../access/constants/permissions.catalog";
import { emptyAccessPayload } from "../../access/types/access-metadata.types";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { normalizePhoneE164 } from "../../../auth/phone/utils/phone-normalize.util";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { bumpAdminUsersCacheGeneration } from "../config/admin-users-cache.config";
import type { CreateUserDto } from "../dto/create-user.dto";
import {
  normalizeUserAdmin,
  USER_ADMIN_SELECT,
  USERS_BCRYPT_ROUNDS,
} from "./user-admin.select";

@Injectable()
export class UsersCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccess: AdminAccessService,
  ) {}

  async create(dto: CreateUserDto, locale: Locale, actorUserId?: string) {
    const email = dto.email.trim().toLowerCase();

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "emailAlreadyUsed")],
          undefined,
          locale,
        ),
      );
    }

    let phone: string | undefined;
    if (dto.phone) {
      const normalizedPhone = normalizePhoneE164(dto.phone);
      if (!normalizedPhone) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "phoneDialCodeRequired")],
            undefined,
            locale,
          ),
        );
      }
      phone = normalizedPhone;
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });
      if (existingPhone) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "phoneAlreadyUsed")],
            undefined,
            locale,
          ),
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, USERS_BCRYPT_ROUNDS);

    const data: Prisma.UserCreateInput = {
      email,
      phone,
      avatarUrl: dto.avatarUrl,
      passwordHash,
      role: dto.role,
      isActive: dto.isActive ?? true,
      profile: {
        create: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
        },
      },
    };

    if (dto.role === Role.ADMIN) {
      if (actorUserId) {
        const canCreateAdmin = await this.adminAccess.hasPermission(
          actorUserId,
          ADMIN_PERMISSIONS.USERS_CREATE_ADMIN,
          locale,
        );
        if (!canCreateAdmin) {
          throw new ForbiddenException(
            translate(locale, "adminUsersCannotCreateAdmin"),
          );
        }
      }
      // Moindre privilège : aucun droit tant qu'un super admin n'attribue pas d'accès.
      data.adminProfile = {
        create: {
          level: dto.adminLevel ?? AdminLevel.EMPLOYEE,
          department: dto.department?.trim() || undefined,
          metadata: { access: emptyAccessPayload() },
        },
      };
    }

    const created = await this.prisma.user.create({
      data,
      select: USER_ADMIN_SELECT,
    });
    bumpAdminUsersCacheGeneration();
    return normalizeUserAdmin(created);
  }
}
