import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import type { Cache } from "cache-manager";
import { EXAMPLES_CACHE_TTL_MS } from "../config/examples-cache.config";

@Injectable()
export class ExamplesCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  wrap<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    return this.cache.wrap(key, fn, ttlMs ?? EXAMPLES_CACHE_TTL_MS);
  }
}
