import {
  identifierKey,
  normalizeEmail,
  userWhereByIdentifier,
} from "./auth-identifier.util";

describe("auth-identifier.util", () => {
  it("normalise l'e-mail", () => {
    expect(normalizeEmail("  John.Doe@Mail.COM ")).toBe("john.doe@mail.com");
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });

  it("construit le filtre Prisma selon le canal", () => {
    expect(
      userWhereByIdentifier({ channel: "phone", value: "+33612345678" }),
    ).toEqual({ phone: "+33612345678" });
    expect(
      userWhereByIdentifier({ channel: "email", value: "a@b.com" }),
    ).toEqual({ email: "a@b.com" });
  });

  it("préfixe la clé par le canal", () => {
    expect(identifierKey({ channel: "email", value: "a@b.com" })).toBe(
      "email:a@b.com",
    );
  });
});
