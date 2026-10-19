import { normalizeExampleName } from "./example-name.util";

describe("normalizeExampleName", () => {
  it("retire les espaces de bord et réduit les espaces internes", () => {
    expect(normalizeExampleName("  Mon   premier \t exemple ")).toBe(
      "Mon premier exemple",
    );
  });

  it("conserve un nom déjà propre", () => {
    expect(normalizeExampleName("Exemple")).toBe("Exemple");
  });
});
