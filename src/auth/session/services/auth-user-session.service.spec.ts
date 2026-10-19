import { shouldPersistLastRequest } from "./auth-user-session.service";

describe("shouldPersistLastRequest", () => {
  const now = Date.parse("2026-10-09T10:00:00.000Z");

  it("écrit si aucune présence n'est connue", () => {
    expect(shouldPersistLastRequest(null, now)).toBe(true);
  });

  it("ignore une requête dans la minute qui suit la dernière présence", () => {
    const last = new Date(now - 30_000);
    expect(shouldPersistLastRequest(last, now)).toBe(false);
  });

  it("écrit de nouveau après une minute", () => {
    const last = new Date(now - 60_000);
    expect(shouldPersistLastRequest(last, now)).toBe(true);
  });

  it("ignore les requêtes parallèles déjà couvertes par une écriture en cours", () => {
    const last = new Date(now - 120_000);
    expect(shouldPersistLastRequest(last, now, now - 5_000)).toBe(false);
  });
});
