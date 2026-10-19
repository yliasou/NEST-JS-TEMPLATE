# TheFlow — NestJS Template

```
 _____ _            ___ _
/__   \ |__   ___  / __\ | _____      __
  / /\/ '_ \ / _ \/ _\ | |/ _ \ \ /\ / /
 / /  | | | |  __/ /   | | (_) \ V  V /
 \/   |_| |_|\___\/    |_|\___/ \_/\_/
```

Socle backend NestJS prêt pour la production : authentification JWT + OTP, permissions fines backoffice, audit, notifications in-app / push / temps réel, e-mails, uploads, cache Redis, files BullMQ et crons multi-instance.

Un module d'exemple (`src/examples`) montre la convention à suivre pour chaque nouveau domaine.

## Stack

- **NestJS 11**, TypeScript
- **Prisma 7** (adapter `pg`) sur PostgreSQL, schéma multi-fichiers
- **Redis** (ioredis) : cache (Keyv), OTP, révocation JWT, throttling partagé, verrous de cron, adapter Socket.IO
- **BullMQ** pour les traitements asynchrones
- **Socket.IO** (namespace `/realtime`)
- **Swagger** (thème sombre) sur `/api/v1/docs`
- Intégrations optionnelles : **Cloudinary** (uploads), **Firebase** (push), **SMTP** (nodemailer)

## Démarrage rapide

```bash
npm install
cp .env.example .env          # puis renseigner JWT_SECRET (32 caractères min.)
docker compose up -d          # PostgreSQL + Redis locaux
npm run prisma:migrate:deploy # applique la migration initiale
npm run prisma:seed           # admin@app.local / ChangeMe123! + un utilisateur démo
npm run start:dev
```

- API : http://localhost:3000/api/v1
- Swagger : http://localhost:3000/api/v1/docs
- Santé : `/api/v1/health/live` et `/api/v1/health/ready` (PostgreSQL + Redis)

Au démarrage, le terminal affiche la bannière TheFlow avec les URLs utiles (`src/common/banner/startup-banner.ts`). Les couleurs sont désactivées hors terminal interactif ou avec `NO_COLOR=1`.

Sans `REDIS_URL`, l'application démarre quand même : cache en mémoire, OTP indisponible, jobs exécutés inline.

## Personnaliser le template pour un nouveau projet

1. `package.json` : `name`, `description`.
2. `src/common/constants/app.constants.ts` : `APP_NAME` (Swagger, bannière), `APP_BRAND` (signature de la bannière) et `REDIS_KEY_PREFIX` (isole les clés si plusieurs projets partagent un Redis).
3. `src/common/i18n/locales/*.json` : `emailBrandTitle`, `emailSignatureTeam`, textes de pied d'e-mail.
4. `src/emailing/templates/brand.constants.ts` : palette des e-mails.
5. `docker-compose.yml` : noms des conteneurs locaux.
6. Dupliquer `src/examples` pour le premier domaine, puis supprimer le module d'exemple (voir plus bas).

## Modules inclus

| Module | Rôle |
| --- | --- |
| `auth` | Parcours téléphone (OTP SMS + PIN) et parcours e-mail (mot de passe + vérification par code), login admin, refresh (rotation : chaque refresh token est à usage unique), logout (révocation Redis), désactivation de compte, présence (`lastRequestAt`) |
| `profile` | `GET`/`PATCH /profile/me`, enregistrement du token push |
| `admin/user` | CRUD utilisateurs, compteur des connectés, OTP permanent |
| `admin/access` | Catalogue de permissions, modèles (`SUPER_ADMIN`, `USER_MANAGER`, `MARKETING_MANAGER`), `@RequirePermission` |
| `audit-trails` | Journal d'audit (explicite + intercepteur HTTP), logs e-mails, événements analytics, export CSV |
| `notifications` | Notifications in-app, push Firebase, temps réel Socket.IO, envois admin (utilisateur / rôle) |
| `emailing` | Envoi SMTP, endpoint admin, layout HTML + template générique |
| `annonces`, `newsletter` | Annonces avec suivi de lecture, inscriptions newsletter |
| `common/uploads` | Upload Cloudinary (multipart et base64) |
| `jobs` | Connexion BullMQ, `QueueProducer` / `QueueWorker`, `JobLockService` (cron une seule fois par créneau) |
| `cache`, `redis` | Cache global, `createCacheNamespace`, vidage admin du cache |
| `socket` | Gateway `/realtime` authentifiée par JWT |
| `health` | Sondes liveness / readiness |

Socle transversal (`src/common`) : format de réponse uniforme, filtre global d'exceptions, validation 422, i18n fr/en, Helmet, CORS, rate limiting (Redis optionnel), blocage d'IP, mode maintenance, contrôle de version mobile, profilage des requêtes.

## Authentification

Deux parcours indépendants, sur des routes séparées. Un compte peut avoir un téléphone et un e-mail ; chaque identifiant a son propre statut de vérification (`user.phoneVerified`, `user.emailVerified`).

### Téléphone — `/auth/phone/*` (OTP SMS + code PIN)

1. `POST /auth/phone/send-code` `{ phone_number }` → `security` (`NEW_ACCOUNT` ou `EXISTING_ACCOUNT`)
2. `POST /auth/phone/verify-code` `{ security, code }`
3. `POST /auth/phone/register` `{ security, phone_number, first_name, last_name, secret_code, email? }` → tokens (téléphone vérifié)
4. `POST /auth/phone/login` `{ phone_number, secret_code }`
5. Mot de passe oublié : `forgot-password` `{ phone_number }` → `verify-code` → `change-password` `{ security, secret_code }`

### E-mail — `/auth/email/*` (e-mail + mot de passe, vérification ensuite)

1. `POST /auth/email/register` `{ email, password, first_name, last_name, phone_number? }` → tokens + `email_verification.security` (code envoyé par e-mail)
2. `POST /auth/email/verify` `{ security, code }` → e-mail vérifié
3. `POST /auth/email/resend-verification` (JWT) → nouveau code
4. `POST /auth/email/login` `{ email, password }` (possible avant vérification)
5. Mot de passe oublié : `forgot-password` `{ email }` → `reset-password` `{ security, code, password }`
6. `GET /auth/email/check-email?email=…` → disponibilité de l'adresse avant inscription

### Session — `/auth/*` (commun aux deux parcours)

`admin/login`, `refresh-token`, `logout`, `deactivate-account`.

### Envoi des codes

`src/auth/otp/services/delivery.service.ts` :

- **E-mail** : via le module `emailing` (SMTP).
- **SMS** : aucun fournisseur branché par défaut. Implémenter `sendSms` (Twilio, Vonage…).

Sans fournisseur pour le canal, l'envoi répond 503 (l'inscription e-mail réussit quand même, `email_verification` vaut `null`). En dev, `OTP_LOG_CODE=true` ou `OTP_RETURN_CODE_IN_RESPONSE=true` permettent de récupérer le code sans envoi. Un jeton d'un parcours est refusé sur les routes de l'autre. Modifier l'e-mail ou le téléphone d'un compte remet sa vérification à zéro.

## Rôles et permissions

- Deux rôles : `USER` (application) et `ADMIN` (backoffice), avec `AdminLevel` (`ADMIN`, `EMPLOYEE`, `SUPPORT`).
- `@Roles(Role.ADMIN)` restreint un contrôleur ; le contrôle est fait par `JwtAuthGuard`.
- `@RequirePermission("module.sousModule.action")` ajoute une permission fine (`PermissionsGuard` global).
- Un admin de niveau `ADMIN` sans `metadata.access` a tous les droits (accès « legacy »). Les droits fins sont stockés dans `AdminProfile.metadata.access`.
- Nouvelles permissions : `src/admin/access/constants/permissions.catalog.ts`.

## Organisation des dossiers

Chaque module NestJS vit dans `src/<module>/`. Deux formes :

- **Module mono-entité** (`examples`, `newsletter`, `annonces`, `profile`, `admin/user`, `admin/access`) : fichiers à plat, rangés par type (structure ci-dessous).
- **Module multi-entités** : un sous-dossier par entité, chacun avec la même structure, plus `shared/` pour ce qui est commun.

```
src/auth/
  auth.module.ts
  shared/          # guard JWT, @Public, @CurrentUser, constantes de validation
  session/         # admin/login, refresh-token, logout, tokens, révocation
  registration/    # création de compte commune aux deux parcours
  phone/           # parcours téléphone (OTP SMS + PIN)
  email/           # parcours e-mail (mot de passe + vérification)
  otp/             # store Redis, envoi, flux de vérification
  account/         # désactivation de compte

src/notifications/
  notifications.module.ts, notifications.service.ts  # façade exportée
  inbox/           # notifications de l'utilisateur connecté
  campaigns/       # envois admin et historique
  push/            # Firebase Cloud Messaging
  delivery/        # dispatch in-app + push + Socket.IO
  shared/          # cache

src/audit-trails/
  audit-trails.module.ts, audit-trails.service.ts
  audit-logs/  email-logs/  analytics-events/   # une entité consultable chacune
  recorder/        # enregistrement (intercepteur HTTP, AuditActionsService, contexte)
  shared/          # types

src/emailing/
  emailing.module.ts, emailing.service.ts   # façade exportée
  send/            # transport SMTP et validation
  admin/           # endpoint d'envoi admin
  templates/       # layout HTML et templates
```

`common/` contient uniquement le transversal (filtres, intercepteurs, i18n, utilitaires, helper `ApiDocumentation`) : la doc Swagger d'un endpoint vit dans le dossier `decorators/` de son entité.

## Convention d'un module

```
src/<domaine>/
  <domaine>.module.ts
  <domaine>.controller.ts        # routes fines : locale, appel service, enveloppe de réponse
  <domaine>.service.ts           # façade : délègue read/write, puis audit et jobs
  config/<domaine>-cache.config.ts   # createCacheNamespace + TTL
  constants/<entité>-select.ts   # select Prisma réutilisé
  decorators/api-<domaine>.decorator.ts  # toute la doc Swagger hors du contrôleur
  dto/                           # DTO d'entrée (class-validator) et schémas de réponse Swagger
  services/
    <domaine>-read.service.ts    # lectures mises en cache
    <domaine>-write.service.ts   # écritures + bump de génération du cache
    <domaine>-validation.service.ts
    <domaine>-cache.service.ts
  jobs/                          # producteur, worker, processor, crons
  utils/                         # fonctions pures + *.spec.ts
```

Pour créer un domaine :

1. Ajouter le modèle dans `prisma/models/<domaine>.prisma`, puis `npm run prisma:migrate`.
2. Copier `src/examples` et renommer.
3. Ajouter les permissions au catalogue, les actions/entités d'audit dans `prisma/models/enums.prisma`, les clés i18n dans `fr.json` / `en.json`.
4. Importer le module dans `src/app.module.ts`.

Supprimer le module d'exemple : `src/examples`, `prisma/models/example.prisma`, la relation `examplesCreated` du modèle `User`, `EXAMPLES_PERMISSIONS`, les méthodes `example*` de `AuditActionsService`, les valeurs `EXAMPLE*` des enums d'audit et les clés i18n `example*`.

## Jobs et crons

- **Queue** : étendre `QueueProducer<T>` (avec `runInline` comme repli sans Redis) et `QueueWorker<T>`. Exemple : `src/examples/jobs/example-created.*`.
- **Cron** : `@Cron(...)` + `jobLock.runOncePerSlot("nom", fn)` pour qu'une seule instance exécute chaque créneau. Exemple : `examples-cleanup.cron.ts`.

## Format des réponses

```json
{ "success": true, "message": "…", "data": {} }
```

Listes paginées (statut **206**) :

```json
{
  "success": true,
  "message": "…",
  "data": [],
  "pagination": { "current_page": 1, "total_pages": 1, "per_page": 10, "total_items": 0 }
}
```

Erreurs :

```json
{ "success": false, "message": "Les données fournies sont invalides", "errors": ["…"] }
```

Statuts particuliers : **422** validation, **410** mise à jour mobile requise (si `VERSION_CHECK_ENABLED=1`), **600** maintenance (`MAINTENANCE_ENABLED=1`).

## En-têtes attendus

| En-tête | Requis |
| --- | --- |
| `Accept: application/json` | Oui (sauf routes listées dans `ACCEPT_HEADER_EXEMPT_PATHS`) |
| `language: fr \| en` | Non (défaut `fr`) |
| `Authorization: Bearer <access_token>` | Routes non `@Public()` |
| `app-mobile-platform`, `app-mobile-version` | Si `VERSION_CHECK_ENABLED=1` |

## Socket.IO

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/realtime", {
  path: "/socket.io",
  transports: ["websocket"],
  auth: { token: accessToken },
});

socket.on("notifications.new", (notification) => console.log(notification));
```

Chaque utilisateur rejoint la room `user:<id>` à la connexion. Avec `REDIS_URL`, les événements sont diffusés entre instances.

## Scripts

```bash
npm run start:dev               # watch
npm run build && npm start      # build compilé
npm run lint                    # ESLint (--fix)
npm test                        # tests unitaires
npm run test:e2e                # tests e2e (PostgreSQL requis)
npm run prisma:migrate          # nouvelle migration (dev)
npm run prisma:migrate:deploy   # applique les migrations
npm run prisma:seed             # comptes admin + démo
npm run prisma:studio
npm run artillery:smoke         # charge légère (voir tests/artillery/README.md)
npm run artillery:load
```

## Déploiement

- **Railway** : `railway.toml` (migrations puis `npm run start`).
- **CI** : `.gitlab-ci.yml` (validate Prisma, lint, typecheck, tests, build).

En production, `src/config/env.validation.ts` refuse de démarrer sans `REDIS_URL`, avec un `JWT_SECRET` faible ou avec les options de debug (`OTP_RETURN_CODE_IN_RESPONSE`, `OTP_LOG_CODE`, `SOCKET_AUTH_ALLOW_PLAIN_USERID`).

## License

[MIT](LICENSE)

## Auteur

TheFlow - Ylias Gadie
