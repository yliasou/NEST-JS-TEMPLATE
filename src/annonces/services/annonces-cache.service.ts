import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import type { Cache } from "cache-manager";
import { ANNONCES_CACHE_TTL_MS } from "../config/annonces-cache.config";

@Injectable()
export class AnnoncesCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  wrap<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    return this.cache.wrap(key, fn, ttlMs ?? ANNONCES_CACHE_TTL_MS);
  }
}
