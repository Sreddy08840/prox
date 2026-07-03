class CacheService {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();

  /**
   * Fetch item from cache, or retrieve from database and save it
   */
  async getOrSet<T>(key: string, ttlMs: number, retrieveFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const value = await retrieveFn();
    this.cache.set(key, { value, expiresAt: now + ttlMs });
    return value;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
export default cacheService;
