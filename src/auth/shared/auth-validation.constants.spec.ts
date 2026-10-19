import {
  ADMIN_APP_USER_PASSWORD_MESSAGE,
  adminUserPasswordErrorMessage,
  isAdminUserPasswordValid,
} from "./auth-validation.constants";

describe("app user password", () => {
  it("accepts a 4-digit PIN, including leading zeros", () => {
    expect(isAdminUserPasswordValid("1234", "USER")).toBe(true);
    expect(isAdminUserPasswordValid("0012", "USER")).toBe(true);
  });

  it("accepts an 8+ character password (email accounts)", () => {
    expect(isAdminUserPasswordValid("MotDePasse1", "USER")).toBe(true);
  });

  it("rejects short or non-numeric 4-character values", () => {
    for (const value of ["abcd", "12ab", "123", "12 3", "abcdefg"]) {
      expect(isAdminUserPasswordValid(value, "USER")).toBe(false);
      expect(adminUserPasswordErrorMessage(value, "USER")).toBe(
        ADMIN_APP_USER_PASSWORD_MESSAGE,
      );
    }
  });

  it("requires 8 characters for staff", () => {
    expect(isAdminUserPasswordValid("ExemplePass8", "ADMIN")).toBe(true);
    expect(isAdminUserPasswordValid("1234", "ADMIN")).toBe(false);
  });
});
