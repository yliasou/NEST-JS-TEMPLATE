import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import { type Locale } from "../../../common/i18n";
import type { ConnectedUsersQueryDto } from "../dto/connected-users-query.dto";
import type { CreateUserDto } from "../dto/create-user.dto";
import type { UpdateUserDto } from "../dto/update-user.dto";
import type { UsersQueryDto } from "../dto/users-query.dto";
import { UsersCreateService } from "./users-create.service";
import { UsersListService } from "./users-list.service";
import { UsersUpdateService } from "./users-update.service";

/**
 * Façade utilisée par le contrôleur : délègue aux services list / create / update.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly list: UsersListService,
    private readonly createSvc: UsersCreateService,
    private readonly updateSvc: UsersUpdateService,
    private readonly auditActions: AuditActionsService,
  ) {}

  findAll(query: UsersQueryDto) {
    return this.list.findAll(query);
  }

  countConnected(query: ConnectedUsersQueryDto) {
    return this.list.countConnected(query);
  }

  findOne(id: string, locale: Locale) {
    return this.list.findOne(id, locale);
  }

  async create(dto: CreateUserDto, locale: Locale, actorUserId?: string) {
    const created = await this.createSvc.create(dto, locale, actorUserId);
    if (actorUserId) {
      await this.auditActions.adminUserCreated(actorUserId, created.id, {
        role: dto.role,
        email: created.email ?? null,
        isActive: dto.isActive !== false,
      });
      if (dto.role === Role.ADMIN) {
        await this.auditActions.adminRoleChanged(actorUserId, created.id, {
          newRole: dto.role,
        });
      }
      if (dto.isActive === false) {
        await this.auditActions.adminUserSuspended(actorUserId, created.id);
      }
    }
    return created;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    locale: Locale,
    actorUserId?: string,
  ) {
    const { user: updated, previousIsActive } = await this.updateSvc.update(
      id,
      dto,
      locale,
    );
    if (
      actorUserId &&
      dto.isActive !== undefined &&
      dto.isActive !== previousIsActive
    ) {
      if (dto.isActive === false) {
        const reason = String(dto.suspensionReason || "").trim();
        await this.auditActions.adminUserSuspended(
          actorUserId,
          id,
          reason ? { reason } : undefined,
        );
      } else {
        await this.auditActions.adminUserRestored(actorUserId, id);
      }
    }
    return updated;
  }

  async setPermanentOtp(
    id: string,
    code: string | null,
    locale: Locale,
    actorUserId?: string,
  ) {
    const updated = await this.updateSvc.setPermanentOtp(id, code, locale);
    if (actorUserId) {
      await this.auditActions.adminUserPermanentOtp(actorUserId, id, {
        enabled: Boolean(code),
      });
    }
    return updated;
  }
}
