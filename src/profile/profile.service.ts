import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Gender } from "@prisma/client";
import { AuditActionsService } from "../audit-trails/recorder/services/audit-actions.service";
import { PrismaService } from "../prisma/prisma.service";
import { translate, type Locale } from "../common/i18n";
import { validationErrorResponse } from "../common/utils/response.util";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpsertPushTokenDto } from "./dto/upsert-push-token.dto";
import {
  mapUserDemographics,
  normalizeOptionalText,
  parseOptionalDateOfBirth,
} from "./utils/profile-user.util";

function buildProfileResponse(user: {
  id: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  dateOfBirth: Date | null;
  gender: Gender | null;
  residentialAddress: string | null;
  profile: { firstName: string; lastName: string };
}) {
  const firstName = user.profile.firstName;
  const lastName = user.profile.lastName;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    ...mapUserDemographics(user),
  };
}

/** Champs stricts pour GET/PATCH profile — une seule requête, sans relations lourdes. */
const profileUserSelect = {
  id: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  dateOfBirth: true,
  gender: true,
  residentialAddress: true,
  deletedAt: true,
  profile: {
    select: { firstName: true, lastName: true },
  },
} as const;

function splitFullName(name: string): { firstName: string; lastName: string } {
  const cleaned = name.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = cleaned.split(" ");
  return {
    firstName,
    lastName: rest.join(" ") || "-",
  };
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditActions: AuditActionsService,
  ) {}

  async me(userId: string) {
    const [user, unreadNotificationsCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: profileUserSelect,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    if (!user || !user.profile || !user.isActive || user.deletedAt) {
      throw new NotFoundException();
    }

    const { deletedAt: _deletedAt, profile, ...userFields } = user;
    return {
      ...buildProfileResponse({ ...userFields, profile }),
      unreadNotificationsCount,
    };
  }

  async update(userId: string, dto: UpdateProfileDto, locale: Locale) {
    const nextEmail = dto.email?.trim().toLowerCase();
    const hasExplicitNames =
      dto.firstName !== undefined || dto.lastName !== undefined;
    const nextName = dto.name?.trim();
    const nextProfileFromName =
      !hasExplicitNames && nextName ? splitFullName(nextName) : null;
    const nextAvatarUrl =
      dto.avatarUrl !== undefined ? dto.avatarUrl.trim() || null : undefined;

    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const emailChanged = Boolean(nextEmail) && nextEmail !== current?.email;

    if (nextEmail) {
      const existing = await this.prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        throw new UnprocessableEntityException(
          validationErrorResponse(
            [translate(locale, "emailAlreadyUsed")],
            undefined,
            locale,
          ),
        );
      }
    }

    const profileUpdate: {
      firstName?: string;
      lastName?: string;
    } = {};
    if (hasExplicitNames) {
      if (dto.firstName !== undefined) {
        profileUpdate.firstName = dto.firstName;
      }
      if (dto.lastName !== undefined) {
        profileUpdate.lastName = dto.lastName;
      }
    } else if (nextProfileFromName) {
      profileUpdate.firstName = nextProfileFromName.firstName;
      profileUpdate.lastName = nextProfileFromName.lastName;
    }
    const hasProfileUpdate = Object.keys(profileUpdate).length > 0;
    const nextDateOfBirth = parseOptionalDateOfBirth(dto.dateOfBirth);
    const nextResidentialAddress = normalizeOptionalText(
      dto.residentialAddress,
    );

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(emailChanged ? { email: nextEmail, emailVerifiedAt: null } : {}),
        ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
        ...(nextDateOfBirth !== undefined
          ? { dateOfBirth: nextDateOfBirth }
          : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(nextResidentialAddress !== undefined
          ? { residentialAddress: nextResidentialAddress }
          : {}),
        ...(hasProfileUpdate ? { profile: { update: profileUpdate } } : {}),
      },
      select: profileUserSelect,
    });

    if (!updated.profile || !updated.isActive || updated.deletedAt) {
      throw new NotFoundException();
    }

    await this.auditActions.profileUpdated(userId, {
      updatedFields: Object.keys(dto).filter(
        (key) => (dto as Record<string, unknown>)[key] !== undefined,
      ),
    });

    const { deletedAt: _deletedAt, profile, ...userFields } = updated;
    return buildProfileResponse({ ...userFields, profile });
  }

  async upsertPushToken(userId: string, dto: UpsertPushTokenDto) {
    return this.prisma.$transaction(async (tx) => {
      const pushToken = await tx.pushToken.upsert({
        where: { token: dto.token },
        create: {
          userId,
          token: dto.token,
          platform: dto.platform,
          isActive: true,
        },
        update: {
          userId,
          platform: dto.platform,
          isActive: true,
        },
        select: {
          id: true,
          token: true,
          platform: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.pushToken.updateMany({
        where: {
          userId,
          isActive: true,
          id: { not: pushToken.id },
        },
        data: { isActive: false },
      });

      return pushToken;
    });
  }
}
