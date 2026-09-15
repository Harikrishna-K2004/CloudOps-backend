"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedCredential = getCachedCredential;
exports.setCachedCredential = setCachedCredential;
exports.invalidateCachedCredential = invalidateCachedCredential;
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
function getCacheKey(userId, provider) {
    return `${userId}:${provider}`;
}
function getCachedCredential(userId, provider) {
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
function setCachedCredential(userId, provider, apiKey) {
    cache.set(getCacheKey(userId, provider), {
        apiKey,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}
function invalidateCachedCredential(userId, provider) {
    cache.delete(getCacheKey(userId, provider));
}
