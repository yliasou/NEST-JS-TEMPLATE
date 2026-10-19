import { DEFAULT_CACHE_TTL_MS } from "../../cache/cache-ttl.constants";
import { createCacheNamespace } from "../../cache/cache-namespace";

export type ExamplesCacheSegment = "examples-list" | "example-detail";

/** Cache Redis pour les exemples. Génération incrémentée après chaque écriture. */
const examplesCache = createCacheNamespace<ExamplesCacheSegment>("examples");

/** TTL par clé (en ms). */
export const EXAMPLES_CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;

export const bumpExamplesCacheGeneration = examplesCache.bumpGeneration;

export const buildExamplesCacheKey = examplesCache.buildKey;
