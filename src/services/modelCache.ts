type Model = {
  id: string;
  name: string;
};

type CacheEntry = {
  models: Model[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCacheKey(userId: string, provider: string) {
  return `${userId}:${provider}`;
}

export function getCachedModels(
  userId: string,
  provider: string,
): Model[] | null {
  const key = getCacheKey(userId, provider);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.models;
}

export function setCachedModels(
  userId: string,
  provider: string,
  models: Model[],
) {
  cache.set(getCacheKey(userId, provider), {
    models,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateCachedModels(
  userId: string,
  provider: string,
) {
  cache.delete(getCacheKey(userId, provider));
}