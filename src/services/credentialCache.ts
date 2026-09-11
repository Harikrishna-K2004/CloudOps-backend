type CacheEntry = {
  apiKey: string;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCacheKey(userId: string, provider: string) {
  return `${userId}:${provider}`;
}

export function getCachedCredential(
  userId: string,
  provider: string,
): string | null {
  const key = getCacheKey(userId, provider);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.apiKey;
}

export function setCachedCredential(
  userId: string,
  provider: string,
  apiKey: string,
) {
  cache.set(getCacheKey(userId, provider), {
    apiKey,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateCachedCredential(
  userId: string,
  provider: string,
) {
  cache.delete(getCacheKey(userId, provider));
}