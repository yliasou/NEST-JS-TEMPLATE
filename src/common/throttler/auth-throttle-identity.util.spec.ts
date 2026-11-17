import { extractAuthThrottleIdentity } from "./auth-throttle-identity.util";

describe("extractAuthThrottleIdentity", () => {
  it("extrait un e-mail normalisé depuis le body", () => {
    expect(
      extractAuthThrottleIdentity({ body: { email: "  Ada@Example.COM " } }),
    ).toBe("email:ada@example.com");
  });

  it("extrait un e-mail depuis la query", () => {
    expect(
      extractAuthThrottleIdentity({ query: { email: "user@app.local" } }),
    ).toBe("email:user@app.local");
  });

  it("extrait un téléphone E.164 depuis phone_number", () => {
    expect(
      extractAuthThrottleIdentity({
        body: { phone_number: "+33 6 12 34 56 78" },
      }),
    ).toBe("phone:+33612345678");
  });

  it("accepte un téléphone sans espaces déjà normalisé", () => {
    expect(
      extractAuthThrottleIdentity({ body: { phone: "+2250707070707" } }),
    ).toBe("phone:+2250707070707");
  });

  it("retourne null sans identifiant exploitable", () => {
    expect(extractAuthThrottleIdentity({ body: { security: "abc" } })).toBe(
      null,
    );
    expect(
      extractAuthThrottleIdentity({ body: { email: "pas-un-email" } }),
    ).toBe(null);
    expect(extractAuthThrottleIdentity({})).toBe(null);
  });
});
