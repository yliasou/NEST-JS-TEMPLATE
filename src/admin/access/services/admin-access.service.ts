import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AdminLevel, Prisma, Role } from "@prisma/client";
import type { Locale } from "../../../common/i18n";
import { translate } from "../../../common/i18n";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import {
  ALL_PERMISSION_KEYS,
  getPermissionsCatalog,
  isKnownPermission,
} from "../constants/permissions.catalog";
import {
  isAccessTemplateId,
  listAccessTemplates,
  mergeAccessFromTemplate,
} from "../constants/permission-templates";
import type {
  AdminAccessPayload,
  EffectiveAdminAccess,
} from "../types/access-metadata.types";
import {
  extractAccessPayload,
  grantedPermissionKeys,
  mergeAccessPayload,
  parseAdminProfileMetadata,
} from "../utils/access-metadata.util";

type UserAccessRow = {
  id: string;
  role: Role;
  isActive: boolean;
  deletedAt: Date | null;
  adminProfile: {
    level: AdminLevel;
    metadata: Prisma.JsonValue | null;
  } | null;
};

@Injectable()
export class AdminAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditActions: AuditActionsService,
  ) {}

  getPermissionsCatalog() {
    return {
      catalog: getPermissionsCatalog(),
      templates: listAccessTemplates(),
      keys: [...ALL_PERMISSION_KEYS],
    };
  }

  async getEffectiveAccess(
    userId: string,
    locale: Locale = "fr",
    options?: { allowInactive?: boolean },
  ): Promise<EffectiveAdminAccess> {
    const user = await this.loadUser(userId, locale, options);
    return this.toEffectiveAccess(user);
  }

  async hasPermission(
    userId: string,
    permission: string,
    locale: Locale = "fr",
  ): Promise<boolean> {
    if (!isKnownPermission(permission)) {
      return false;
    }
    const access = await this.getEffectiveAccess(userId, locale);
    if (access.isSuperAdmin) {
      return true;
    }
    return access.permissionsMap[permission] === true;
  }

  async assertPermission(
    userId: string,
    permission: string,
    locale: Locale = "fr",
  ): Promise<void> {
    const allowed = await this.hasPermission(userId, permission, locale);
    if (!allowed) {
      throw new ForbiddenException(translate(locale, "forbidden"));
    }
  }

  async assertAnyPermission(
    userId: string,
    permissions: string[],
    locale: Locale = "fr",
  ): Promise<void> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, locale)) {
        return;
      }
    }
    throw new ForbiddenException(translate(locale, "forbidden"));
  }

  async getUserAccessResponse(
    userId: string,
    locale: Locale = "fr",
    options?: { allowInactive?: boolean },
  ) {
    const access = await this.getEffectiveAccess(userId, locale, options);
    return {
      userId: access.userId,
      role: access.role,
      adminLevel: access.adminLevel,
      isSuperAdmin: access.isSuperAdmin,
      legacyFullAccess: access.legacyFullAccess,
      permissions: access.permissions,
    };
  }

  async updateUserAccess(
    actorUserId: string,
    targetUserId: string,
    patch: {
      isSuperAdmin?: boolean;
      permissions?: Record<string, boolean>;
    },
    locale: Locale = "fr",
  ) {
    this.assertNotSelf(actorUserId, targetUserId, locale);
    await this.assertPermission(actorUserId, "admin.access.update", locale);

    const actor = await this.getEffectiveAccess(actorUserId, locale);
    const target = await this.loadUser(targetUserId, locale, {
      allowInactive: true,
    });
    this.assertTargetIsAdmin(target, locale);

    const previous = extractAccessPayload(target.adminProfile?.metadata, {
      locale,
      strict: false,
    });
    const previousEffective = this.toEffectiveAccess(target);

    if (patch.permissions) {
      this.validatePermissionsPatch(patch.permissions, locale);
      this.assertCanGrantPermissions(actor, patch.permissions, locale);
    }

    if (patch.isSuperAdmin === true) {
      this.assertCanGrantSuperAdmin(actor, locale);
    }

    if (patch.isSuperAdmin === false && previousEffective.isSuperAdmin) {
      await this.assertNotLastSuperAdmin(targetUserId, locale);
    }

    const nextAccess = mergeAccessPayload(previous, patch);
    await this.persistAccess(targetUserId, target, nextAccess);

    await this.auditAccessChange(
      actorUserId,
      targetUserId,
      previous,
      nextAccess,
    );

    return this.getUserAccessResponse(targetUserId, locale, {
      allowInactive: true,
    });
  }

  async resetUserAccess(
    actorUserId: string,
    targetUserId: string,
    locale: Locale = "fr",
  ) {
    this.assertNotSelf(actorUserId, targetUserId, locale);
    await this.assertPermission(actorUserId, "admin.access.reset", locale);

    const target = await this.loadUser(targetUserId, locale, {
      allowInactive: true,
    });
    this.assertTargetIsAdmin(target, locale);

    const previous = extractAccessPayload(target.adminProfile?.metadata, {
      locale,
      strict: false,
    });
    const previousEffective = this.toEffectiveAccess(target);

    if (previousEffective.isSuperAdmin) {
      await this.assertNotLastSuperAdmin(targetUserId, locale);
    }

    await this.clearAccessMetadata(targetUserId, target);

    await this.auditActions.adminAccessReset(actorUserId, targetUserId, {
      previousAccess: previous,
    });

    return this.getUserAccessResponse(targetUserId, locale, {
      allowInactive: true,
    });
  }

  async applyTemplate(
    actorUserId: string,
    targetUserId: string,
    templateId: string,
    locale: Locale = "fr",
  ) {
    this.assertNotSelf(actorUserId, targetUserId, locale);
    await this.assertPermission(
      actorUserId,
      "admin.access.assign_template",
      locale,
    );

    if (!isAccessTemplateId(templateId)) {
      throw new BadRequestException(
        translate(locale, "adminAccessUnknownTemplate", { templateId }),
      );
    }

    const actor = await this.getEffectiveAccess(actorUserId, locale);
    const target = await this.loadUser(targetUserId, locale, {
      allowInactive: true,
    });
    this.assertTargetIsAdmin(target, locale);

    const previous = extractAccessPayload(target.adminProfile?.metadata, {
      locale,
      strict: false,
    });
    // Union des droits : un modèle supplémentaire ajoute sans retirer (sauf SUPER_ADMIN).
    const nextAccess = mergeAccessFromTemplate(previous, templateId);

    if (nextAccess.isSuperAdmin) {
      this.assertCanGrantSuperAdmin(actor, locale);
    }

    this.assertCanGrantPermissions(actor, nextAccess.permissions, locale);

    const previousEffective = this.toEffectiveAccess(target);
    if (previousEffective.isSuperAdmin && !nextAccess.isSuperAdmin) {
      await this.assertNotLastSuperAdmin(targetUserId, locale);
    }

    await this.persistAccess(targetUserId, target, nextAccess);

    await this.auditActions.adminAccessTemplateApply(
      actorUserId,
      targetUserId,
      {
        templateId,
        previousAccess: previous,
        nextAccess,
      },
    );

    return this.getUserAccessResponse(targetUserId, locale, {
      allowInactive: true,
    });
  }

  async recordAccessView(actorUserId: string, targetUserId?: string) {
    await this.auditActions.adminAccessView(actorUserId, targetUserId);
  }

  // ─── Internals ───────────────────────────────────────────────

  private toEffectiveAccess(user: UserAccessRow): EffectiveAdminAccess {
    const stored = extractAccessPayload(user.adminProfile?.metadata, {
      strict: false,
    });
    const level = user.adminProfile?.level ?? null;
    // Plus d'accès « legacy » : sans metadata.access, un admin n'a aucun droit
    // (sauf isSuperAdmin explicite). Le seed pose isSuperAdmin sur le compte initial.
    const isSuperAdmin = stored?.isSuperAdmin === true;
    const permissionsMap = stored?.permissions ?? {};
    const permissions = isSuperAdmin
      ? [...ALL_PERMISSION_KEYS]
      : grantedPermissionKeys(permissionsMap);

    return {
      userId: user.id,
      role: user.role,
      adminLevel: level,
      isSuperAdmin,
      legacyFullAccess: false,
      permissions,
      permissionsMap: isSuperAdmin
        ? Object.fromEntries(ALL_PERMISSION_KEYS.map((k) => [k, true]))
        : permissionsMap,
    };
  }

  private async loadUser(
    userId: string,
    locale: Locale,
    options?: { allowInactive?: boolean },
  ): Promise<UserAccessRow> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        deletedAt: true,
        adminProfile: {
          select: { level: true, metadata: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }

    if (!user.isActive && !options?.allowInactive) {
      throw new ForbiddenException(
        translate(locale, "adminAccessUserInactive"),
      );
    }

    return user;
  }

  private assertNotSelf(
    actorUserId: string,
    targetUserId: string,
    locale: Locale,
  ) {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException(
        translate(locale, "adminAccessCannotModifySelf"),
      );
    }
  }

  private assertTargetIsAdmin(user: UserAccessRow, locale: Locale) {
    if (user.role !== Role.ADMIN || !user.adminProfile) {
      throw new BadRequestException(
        translate(locale, "adminAccessTargetNotAdmin"),
      );
    }
  }

  private validatePermissionsPatch(
    permissions: Record<string, boolean>,
    locale: Locale,
  ) {
    for (const [key, value] of Object.entries(permissions)) {
      if (typeof value !== "boolean") {
        throw new BadRequestException(
          translate(locale, "adminAccessInvalidMetadata"),
        );
      }
      if (!isKnownPermission(key)) {
        throw new BadRequestException(
          translate(locale, "adminAccessUnknownPermission", { key }),
        );
      }
    }
  }

  private assertCanGrantPermissions(
    actor: EffectiveAdminAccess,
    permissions: Record<string, boolean>,
    locale: Locale,
  ) {
    if (actor.isSuperAdmin) return;

    for (const [key, granted] of Object.entries(permissions)) {
      if (!granted) continue;
      if (actor.permissionsMap[key] !== true) {
        throw new ForbiddenException(
          translate(locale, "adminAccessCannotGrantPermission", { key }),
        );
      }
    }
  }

  private assertCanGrantSuperAdmin(
    actor: EffectiveAdminAccess,
    locale: Locale,
  ) {
    if (!actor.isSuperAdmin) {
      throw new ForbiddenException(
        translate(locale, "adminAccessCannotGrantSuperAdmin"),
      );
    }
  }

  private async assertNotLastSuperAdmin(targetUserId: string, locale: Locale) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: Role.ADMIN,
        isActive: true,
        deletedAt: null,
        adminProfile: { isNot: null },
      },
      select: {
        id: true,
        adminProfile: { select: { level: true, metadata: true } },
      },
    });

    const otherSuperAdmins = admins.filter((u) => {
      if (u.id === targetUserId) return false;
      const stored = extractAccessPayload(u.adminProfile?.metadata, {
        strict: false,
      });
      return stored?.isSuperAdmin === true;
    });

    if (otherSuperAdmins.length === 0) {
      throw new ForbiddenException(
        translate(locale, "adminAccessCannotRemoveLastSuperAdmin"),
      );
    }
  }

  private async persistAccess(
    targetUserId: string,
    target: UserAccessRow,
    access: AdminAccessPayload,
  ) {
    const currentMeta = parseAdminProfileMetadata(
      target.adminProfile?.metadata,
      { strict: false },
    );
    const nextMeta = {
      ...currentMeta,
      access,
    };

    await this.prisma.adminProfile.update({
      where: { userId: targetUserId },
      data: {
        metadata: nextMeta,
      },
    });
  }

  private async clearAccessMetadata(
    targetUserId: string,
    target: UserAccessRow,
  ) {
    const currentMeta = parseAdminProfileMetadata(
      target.adminProfile?.metadata,
      { strict: false },
    );
    const { access: _removed, ...rest } = currentMeta;
    const nextMeta =
      Object.keys(rest).length > 0
        ? (rest as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    await this.prisma.adminProfile.update({
      where: { userId: targetUserId },
      data: { metadata: nextMeta },
    });
  }

  private async auditAccessChange(
    actorUserId: string,
    targetUserId: string,
    previous: AdminAccessPayload | null,
    next: AdminAccessPayload,
  ) {
    const prevPerms = previous?.permissions ?? {};
    const nextPerms = next.permissions;
    const permissionsChanged =
      JSON.stringify(prevPerms) !== JSON.stringify(nextPerms);
    const superAdminChanged =
      (previous?.isSuperAdmin === true) !== next.isSuperAdmin;

    await this.auditActions.adminAccessUpdate(actorUserId, targetUserId, {
      previousAccess: previous,
      nextAccess: next,
    });

    if (permissionsChanged) {
      await this.auditActions.adminUserPermissionChange(
        actorUserId,
        targetUserId,
        {
          previousPermissions: prevPerms,
          nextPermissions: nextPerms,
        },
      );
    }

    if (superAdminChanged) {
      await this.auditActions.adminSuperAdminChange(actorUserId, targetUserId, {
        previousIsSuperAdmin: previous?.isSuperAdmin === true,
        nextIsSuperAdmin: next.isSuperAdmin,
      });
    }
  }
}
