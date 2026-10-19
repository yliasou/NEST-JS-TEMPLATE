import { DEFAULT_CACHE_TTL_MS } from "../../cache/cache-ttl.constants";
import { createCacheNamespace } from "../../cache/cache-namespace";

export type AnnoncesCacheSegment =
  | "annonces-list"
  | "annonce-detail"
  | "annonce-latest-unread";

/** Cache Redis pour les annonces. Génération incrémentée après chaque écriture. */
const annoncesCache = createCacheNamespace<AnnoncesCacheSegment>("annonces");

/** TTL par clé (en ms). */
export const ANNONCES_CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;

export const bumpAnnoncesCacheGeneration = annoncesCache.bumpGeneration;

export const buildAnnoncesCacheKey = annoncesCache.buildKey;
