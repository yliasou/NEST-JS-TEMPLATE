import { Role } from "@prisma/client";
import {
  annoncesQueryForRole,
  seesInactiveAnnonces,
} from "./annonce-visibility.util";

describe("annonce-visibility", () => {
  const query = { isActive: false, page: 1 };

  it("laisse le filtre admin tel quel", () => {
    expect(seesInactiveAnnonces(Role.ADMIN)).toBe(true);
    expect(annoncesQueryForRole(query, Role.ADMIN)).toEqual(query);
  });

  it("force les annonces actives pour les utilisateurs non admin", () => {
    expect(annoncesQueryForRole(query, Role.USER).isActive).toBe(true);
    expect(annoncesQueryForRole(query).isActive).toBe(true);
  });
});
