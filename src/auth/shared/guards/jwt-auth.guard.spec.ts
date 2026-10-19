import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../../../common/rbac/roles.constants";
import { JwtAuthGuard } from "./jwt-auth.guard";

const JWT_SECRET = "test-secret-at-least-32-characters-long";

function createGuard(options: {
  dbRole?: Role;
  isActive?: boolean;
  requiredRoles?: Role[];
  revoked?: boolean;
}) {
  const jwtService = new JwtService({ secret: JWT_SECRET });
  const reflector = {
    getAllAndOverride: jest.fn((key: string) =>
      key === ROLES_KEY ? options.requiredRoles : undefined,
    ),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: "user-1",
        role: options.dbRole ?? Role.USER,
        isActive: options.isActive ?? true,
        deletedAt: null,
        lastRequestAt: null,
      }),
    },
  };
  const tokenRevocation = {
    isRevoked: jest.fn().mockResolvedValue(options.revoked ?? false),
  };
  const userSession = { noteAuthenticatedRequest: jest.fn() };
  const guard = new JwtAuthGuard(
    jwtService,
    reflector as any,
    prisma as any,
    tokenRevocation as any,
    userSession as any,
  );
  return { guard, jwtService };
}

function createContext(token: string) {
  const request: Record<string, any> = {
    headers: { authorization: `Bearer ${token}`, language: "fr" },
    path: "/api/v1/admin/examples",
    url: "/api/v1/admin/examples",
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
  return { context, request };
}

function accessToken(jwtService: JwtService, role: Role) {
  return jwtService.sign({ sub: "user-1", type: "access", role });
}

describe("JwtAuthGuard", () => {
  it("attache le rôle en base à la requête, même si le JWT en annonce un autre", async () => {
    const { guard, jwtService } = createGuard({ dbRole: Role.USER });
    const { context, request } = createContext(
      accessToken(jwtService, Role.ADMIN),
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ id: "user-1", role: Role.USER });
  });

  it("refuse une route admin à un compte rétrogradé dont le JWT dit ADMIN", async () => {
    const { guard, jwtService } = createGuard({
      dbRole: Role.USER,
      requiredRoles: [Role.ADMIN],
    });
    const { context } = createContext(accessToken(jwtService, Role.ADMIN));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("refuse un compte désactivé", async () => {
    const { guard, jwtService } = createGuard({ isActive: false });
    const { context } = createContext(accessToken(jwtService, Role.USER));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refuse un jeton révoqué", async () => {
    const { guard, jwtService } = createGuard({ revoked: true });
    const { context } = createContext(accessToken(jwtService, Role.USER));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refuse un refresh token utilisé comme access token", async () => {
    const { guard, jwtService } = createGuard({});
    const { context } = createContext(
      jwtService.sign({ sub: "user-1", type: "refresh" }),
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
