import { renderStartupBanner } from "./startup-banner";

describe("renderStartupBanner", () => {
  const startedAt = new Date("2026-01-01T10:00:00Z");

  it("affiche le logo, l'accueil et les URLs", () => {
    const banner = renderStartupBanner({
      port: 3000,
      environment: "development",
      swaggerEnabled: true,
      startedAt,
      colors: false,
    });

    expect(banner).toContain("/__   \\ |__");
    expect(banner).toContain("Welcome!");
    expect(banner).toContain("TheFlow");
    expect(banner).toContain("http://localhost:3000/api/v1");
    expect(banner).toContain("http://localhost:3000/api/v1/docs");
    expect(banner).toContain("development");
    expect(banner).not.toContain("\x1b[");
  });

  it("masque Swagger quand il est désactivé", () => {
    const banner = renderStartupBanner({
      port: 3000,
      environment: "production",
      swaggerEnabled: false,
      startedAt,
      colors: false,
    });

    expect(banner).not.toContain("/api/v1/docs");
  });

  it("colore la sortie quand demandé", () => {
    const banner = renderStartupBanner({
      port: 3000,
      environment: "development",
      swaggerEnabled: true,
      startedAt,
      colors: true,
    });

    expect(banner).toContain("\x1b[36m");
  });
});
