import { UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { getUserId, requireUser, requireUserId } from "./authed-request";

describe("authed-request", () => {
  it("reads the user id from `id` first, then `sub`", () => {
    expect(getUserId({ user: { id: "a", sub: "b" } })).toBe("a");
    expect(getUserId({ user: { sub: "b" } })).toBe("b");
    expect(getUserId({})).toBeUndefined();
  });

  it("throws 401 when the user id is missing", () => {
    expect(() => requireUserId({})).toThrow(UnauthorizedException);
    expect(requireUserId({ user: { sub: "b" } })).toBe("b");
  });

  it("requires both id and role for requireUser", () => {
    expect(requireUser({ user: { id: "a", role: Role.ADMIN } })).toEqual({
      userId: "a",
      role: Role.ADMIN,
    });
    expect(() => requireUser({ user: { id: "a" } })).toThrow(
      UnauthorizedException,
    );
  });
});
