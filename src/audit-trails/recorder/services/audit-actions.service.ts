import { Injectable } from "@nestjs/common";
import { AuditAction, AuditEntity, Prisma } from "@prisma/client";
import { AuditTrailRecorderService } from "./audit-trail-recorder.service";

@Injectable()
export class AuditActionsService {
  constructor(private readonly recorder: AuditTrailRecorderService) {}

  authRegister(actorUserId: string, metadata?: Prisma.InputJsonValue) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId: actorUserId,
      action: AuditAction.AUTH_REGISTER,
      entity: AuditEntity.USER,
      entityId: actorUserId,
      metadata,
    });
  }

  authLogin(actorUserId: string, metadata?: Prisma.InputJsonValue) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId: actorUserId,
      action: AuditAction.AUTH_LOGIN,
      entity: AuditEntity.USER,
      entityId: actorUserId,
      metadata,
    });
  }

  authRefreshToken(actorUserId: string, metadata?: Prisma.InputJsonValue) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId: actorUserId,
      action: AuditAction.AUTH_REFRESH_TOKEN,
      entity: AuditEntity.USER,
      entityId: actorUserId,
      metadata,
    });
  }

  authLogout(actorUserId: string, metadata?: Prisma.InputJsonValue) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId: actorUserId,
      action: AuditAction.AUTH_LOGOUT,
      entity: AuditEntity.USER,
      entityId: actorUserId,
      metadata,
    });
  }

  authAccountDeactivate(actorUserId: string, metadata?: Prisma.InputJsonValue) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId: actorUserId,
      action: AuditAction.AUTH_ACCOUNT_DEACTIVATE,
      entity: AuditEntity.USER,
      entityId: actorUserId,
      metadata,
    });
  }

  profileUpdated(actorUserId: string, metadata?: Prisma.InputJsonValue) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId: actorUserId,
      action: AuditAction.PROFILE_UPDATE,
      entity: AuditEntity.USER_PROFILE,
      entityId: actorUserId,
      metadata,
    });
  }

  adminUserCreated(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_USER_CREATE,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminRoleChanged(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_ROLE_CHANGE,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminNotificationSent(
    actorUserId: string,
    targetUserId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_NOTIFICATION_SEND,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminUserSuspended(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_USER_SUSPEND,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminUserRestored(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_USER_RESTORE,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminUserPermanentOtp(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_USER_PERMANENT_OTP,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminAccessView(
    actorUserId: string,
    targetUserId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_ACCESS_VIEW,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminAccessUpdate(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_ACCESS_UPDATE,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminAccessReset(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_ACCESS_RESET,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminAccessTemplateApply(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_ACCESS_TEMPLATE_APPLY,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminUserPermissionChange(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_USER_PERMISSION_CHANGE,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  adminSuperAdminChange(
    actorUserId: string,
    targetUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      targetUserId,
      action: AuditAction.ADMIN_SUPER_ADMIN_CHANGE,
      entity: AuditEntity.USER,
      entityId: targetUserId,
      metadata,
    });
  }

  fileUploaded(
    actorUserId: string,
    filePublicId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.FILE_UPLOAD,
      entity: AuditEntity.FILE_ATTACHMENT,
      entityId: filePublicId,
      metadata,
    });
  }

  exampleCreated(
    actorUserId: string,
    exampleId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.EXAMPLE_CREATE,
      entity: AuditEntity.EXAMPLE,
      entityId: exampleId,
      metadata,
    });
  }

  exampleUpdated(
    actorUserId: string,
    exampleId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.EXAMPLE_UPDATE,
      entity: AuditEntity.EXAMPLE,
      entityId: exampleId,
      metadata,
    });
  }

  exampleDeleted(
    actorUserId: string,
    exampleId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.EXAMPLE_DELETE,
      entity: AuditEntity.EXAMPLE,
      entityId: exampleId,
      metadata,
    });
  }

  trackModuleActivity(input: {
    actorUserId?: string;
    name: string;
    properties?: Prisma.InputJsonValue;
  }) {
    return this.recorder.trackModuleActivity(input);
  }
  personCreated(
    actorUserId: string,
    personId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.PERSON_CREATE,
      entity: AuditEntity.PERSON,
      entityId: personId,
      metadata,
    });
  }

  personUpdated(
    actorUserId: string,
    personId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.PERSON_UPDATE,
      entity: AuditEntity.PERSON,
      entityId: personId,
      metadata,
    });
  }

  personDeleted(
    actorUserId: string,
    personId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.recorder.recordAction({
      actorUserId,
      action: AuditAction.PERSON_DELETE,
      entity: AuditEntity.PERSON,
      entityId: personId,
      metadata,
    });
  }
}
