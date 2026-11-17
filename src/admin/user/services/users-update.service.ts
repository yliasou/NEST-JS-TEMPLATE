import * as bcrypt from "bcrypt";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  adminUserPasswordErrorMessage,
  isAdminUserPasswordValid,
} from "../../../auth/shared/auth-validation.constants";
import { normalizePhoneE164 } from "../../../auth/phone/utils/phone-normalize.util";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { bumpAdminUsersCacheGeneration } from "../config/admin-users-cache.config";
import type { UpdateUserDto } from "../dto/update-user.dto";
import {
  normalizeUserAdmin,
  USER_ADMIN_SELECT,
  USERS_BCRYPT_ROUNDS,
} from "./user-admin.select";

@Injectable()
export class UsersUpdateService {
  constructor(private readonly prisma: PrismaService) {}

  async update(id: string, dto: UpdateUserDto, locale: Locale) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isActive: true,
        email: true,
        phone: true,
        profile: { select: { userId: true } },
        adminProfile: { select: { id: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }

    const hasAny = (Object.keys(dto) as (keyof UpdateUserDto)[]).some(
      (k) => dto[k] !== undefined,
    );
    if (!hasAny) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "userUpdateEmpty")],
          translate(locale, "validationSummary"),
          locale,
        ),
      );
    }

    if (dto.adminLevel !== undefined || dto.department !== undefined) {
      if (existing.role !== Role.ADMIN || !existing.adminProfile) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "userUpdateFieldsNotApplicable")],
            undefined,
            locale,
          ),
        );
      }
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const taken = await this.prisma.user.findFirst({
        where: { email, NOT: { id } },
        select: { id: true },
      });
      if (taken) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "emailAlreadyUsed")],
            undefined,
            locale,
          ),
        );
      }
    }

    if (dto.phone !== undefined && dto.phone !== null) {
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
      dto.phone = normalizedPhone;
      const taken = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone, NOT: { id } },
        select: { id: true },
      });
      if (taken) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "phoneAlreadyUsed")],
            undefined,
            locale,
          ),
        );
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      data.email = email;
      if (email !== existing.email) data.emailVerifiedAt = null;
    }
    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = dto.avatarUrl;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone;
      if (dto.phone !== existing.phone) data.phoneVerifiedAt = null;
    }
    if (dto.password !== undefined) {
      if (!isAdminUserPasswordValid(dto.password, existing.role)) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [adminUserPasswordErrorMessage(dto.password, existing.role)],
            undefined,
            locale,
          ),
        );
      }
      data.passwordHash = await bcrypt.hash(dto.password, USERS_BCRYPT_ROUNDS);
      data.tokenVersion = { increment: 1 };
    }

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      if (!existing.profile) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "userUpdateNoProfile")],
            undefined,
            locale,
          ),
        );
      }
      data.profile = {
        update: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        },
      };
    }

    if (dto.adminLevel !== undefined || dto.department !== undefined) {
      data.adminProfile = {
        update: {
          ...(dto.adminLevel !== undefined ? { level: dto.adminLevel } : {}),
          ...(dto.department !== undefined
            ? {
                department:
                  dto.department === null || dto.department.trim() === ""
                    ? null
                    : dto.department.trim(),
              }
            : {}),
        },
      };
    }

    if (Object.keys(data).length === 0) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "userUpdateEmpty")],
          translate(locale, "validationSummary"),
          locale,
        ),
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_ADMIN_SELECT,
    });
    bumpAdminUsersCacheGeneration();
    return {
      user: normalizeUserAdmin(updated),
      previousIsActive: Boolean(existing.isActive),
    };
  }

  async setPermanentOtp(id: string, code: string | null, locale: Locale) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, phone: true, role: true },
    });
    if (!existing) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }
    if (existing.role !== Role.USER) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "permanentOtpAppUsersOnly")],
          undefined,
          locale,
        ),
      );
    }
    if (code && !existing.phone) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "permanentOtpRequiresPhone")],
          undefined,
          locale,
        ),
      );
    }

    const permanentOtpHash = code
      ? await bcrypt.hash(code, USERS_BCRYPT_ROUNDS)
      : null;
    const row = await this.prisma.user.update({
      where: { id },
      data: { permanentOtpHash, permanentOtpCode: code },
      select: USER_ADMIN_SELECT,
    });
    bumpAdminUsersCacheGeneration();
    return normalizeUserAdmin(row);
  }
}
