import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { EmailRegisterDto } from "./email-register.dto";

const base = {
  email: "  Ada@Example.COM ",
  password: "MotDePasse1",
  first_name: "Ada",
  last_name: "Lovelace",
};

function invalidProperties(payload: Record<string, unknown>): string[] {
  const dto = plainToInstance(EmailRegisterDto, payload);
  return validateSync(dto).map((e) => e.property);
}

describe("EmailRegisterDto", () => {
  it("accepte une inscription minimale et normalise l'e-mail", () => {
    const dto = plainToInstance(EmailRegisterDto, base);
    expect(validateSync(dto)).toEqual([]);
    expect(dto.email).toBe("ada@example.com");
  });

  it("exige un mot de passe de 8 caractères", () => {
    expect(invalidProperties({ ...base, password: "1234" })).toEqual([
      "password",
    ]);
  });

  it("accepte un téléphone optionnel au format E.164", () => {
    expect(
      invalidProperties({ ...base, phone_number: "+33 6 12 34 56 78" }),
    ).toEqual([]);
    expect(invalidProperties({ ...base, phone_number: "0612345678" })).toEqual([
      "phone_number",
    ]);
  });

  it("refuse un e-mail invalide", () => {
    expect(invalidProperties({ ...base, email: "pas-un-email" })).toEqual([
      "email",
    ]);
  });
});
