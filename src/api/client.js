const cache = new Map();

/**
 * Cache a fetcher result for ttlMs. On error, return stale data if available.
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 * @param {number} ttlMs
 */
export async function fetchCached(key, fetcher, ttlMs) {
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.at < ttlMs) return cached.data;

  try {
    const data = await fetcher();
    cache.set(key, { data, at: now });
    return data;
  } catch (e) {
    if (cached) {
      console.warn(`Using stale cache for ${key}:`, e.message);
      return cached.data;
    }
    throw e;
  }
}

export function clearCache() {
  cache.clear();
}

export function cacheSize() {
  return cache.size;
}
