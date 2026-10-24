import type { ExamplesObject } from "@nestjs/swagger";
import { AdminLevel } from "@prisma/client";

/** Exemples Swagger pour `PATCH /admin/users/:id`. */
export const USER_UPDATE_SWAGGER_EXAMPLES: ExamplesObject = {
  DESACTIVER: {
    summary: "Désactiver le compte",
    description:
      "L'utilisateur ne peut plus se connecter tant que `isActive` n’est pas remis à `true`.",
    value: { isActive: false },
  },
  REACTIVER: {
    summary: "Réactiver le compte",
    value: { isActive: true },
  },
  ADMIN_NIVEAU: {
    summary: "ADMIN — changer le niveau",
    description: "Uniquement si le compte est `ADMIN` avec un `AdminProfile`.",
    value: {
      adminLevel: AdminLevel.ADMIN,
      department: "Direction",
    },
  },
  CHANGER_EMAIL: {
    summary: "Modifier l’e-mail",
    value: { email: "nouveau.email@example.com" },
  },
  CHANGER_AVATAR: {
    summary: "Modifier l’avatar",
    value: { avatarUrl: "https://cdn.example.com/avatars/nouvel-avatar.jpg" },
  },
  CHANGER_MOT_DE_PASSE: {
    summary: "Réinitialiser le mot de passe",
    value: { password: "NouveauPass8" },
  },
};
