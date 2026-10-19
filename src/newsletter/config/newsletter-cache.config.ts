import { DEFAULT_CACHE_TTL_MS } from "../../cache/cache-ttl.constants";
import { createCacheNamespace } from "../../cache/cache-namespace";

export type NewsletterCacheSegment = "subscribers-list";

/** Cache Redis pour la liste admin des inscrits newsletter. Génération incrémentée après chaque écriture. */
const newsletterCache =
  createCacheNamespace<NewsletterCacheSegment>("newsletter");

/** TTL par clé (en ms). */
export const NEWSLETTER_CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;

export const bumpNewsletterCacheGeneration = newsletterCache.bumpGeneration;

export const buildNewsletterCacheKey = newsletterCache.buildKey;
