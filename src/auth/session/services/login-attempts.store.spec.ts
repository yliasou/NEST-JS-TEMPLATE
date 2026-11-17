import {
  LOGIN_MAX_FAILED_ATTEMPTS,
  LoginAttemptsStore,
} from "./login-attempts.store";

describe("LoginAttemptsStore", () => {
  it("expose des clés stables user / email / phone", () => {
    expect(LoginAttemptsStore.userKey("abc")).toBe("user:abc");
    expect(LoginAttemptsStore.emailKey("  Ada@Example.COM ")).toBe(
      "email:ada@example.com",
    );
    expect(LoginAttemptsStore.phoneKey(" +33612345678 ")).toBe(
      "phone:+33612345678",
    );
  });

  it("verrouille après N échecs puis se réinitialise au clear", async () => {
    const store = new LoginAttemptsStore(null);
    const key = LoginAttemptsStore.userKey("user-1");

    for (let i = 0; i < LOGIN_MAX_FAILED_ATTEMPTS - 1; i++) {
      await store.recordFailure(key);
      await expect(store.assertNotLocked(key)).resolves.toBe(true);
    }

    await store.recordFailure(key);
    await expect(store.assertNotLocked(key)).resolves.toBe(false);

    await store.clear(key);
    await expect(store.assertNotLocked(key)).resolves.toBe(true);
  });

  it("assertNotLocked échoue si l'une des clés est verrouillée", async () => {
    const store = new LoginAttemptsStore(null);
    const userKey = LoginAttemptsStore.userKey("user-1");
    const emailKey = LoginAttemptsStore.emailKey("a@b.c");

    for (let i = 0; i < LOGIN_MAX_FAILED_ATTEMPTS; i++) {
      await store.recordFailure(userKey);
    }

    await expect(store.assertNotLocked(userKey, emailKey)).resolves.toBe(false);
    await expect(store.assertNotLocked(emailKey)).resolves.toBe(true);
  });
});
