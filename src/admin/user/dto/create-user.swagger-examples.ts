import type { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { AdminLevel, Role } from "@prisma/client";

/**
 * Exemples Swagger pour `POST /admin/users` : un cas par rôle.
 * Dans Swagger UI : menu déroulant **Examples** sur le body pour préremplir le JSON.
 */
export const USER_CREATE_SWAGGER_EXAMPLES: ExamplesObject = {
  USER: {
    summary: "USER — utilisateur applicatif",
    description:
      "Compte utilisateur avec profil (`firstName` / `lastName`) et téléphone optionnel. Mot de passe : PIN de 4 chiffres (ex. `0000`).",
    value: {
      role: Role.USER,
      email: "user.exemple@example.com",
      password: "0000",
      firstName: "Ada",
      lastName: "Lovelace",
      avatarUrl: "https://cdn.example.com/avatars/ada-lovelace.jpg",
      phone: "+2250707070707",
      isActive: true,
    },
  },
  ADMIN: {
    summary: "ADMIN — équipe interne",
    description:
      "`adminLevel` optionnel (défaut côté API : EMPLOYEE si omis), `department` optionnel.",
    value: {
      role: Role.ADMIN,
      email: "admin.support@example.com",
      password: "ExemplePass8",
      firstName: "Support",
      lastName: "Team",
      avatarUrl: "https://cdn.example.com/avatars/admin-support.jpg",
      phone: "+2250707070707",
      adminLevel: AdminLevel.SUPPORT,
      department: "Support",
      isActive: true,
    },
  },
};
