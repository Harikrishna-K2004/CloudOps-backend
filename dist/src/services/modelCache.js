"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedModels = getCachedModels;
exports.setCachedModels = setCachedModels;
exports.invalidateCachedModels = invalidateCachedModels;
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
function getCacheKey(userId, provider) {
    return `${userId}:${provider}`;
}
function getCachedModels(userId, provider) {
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
function setCachedModels(userId, provider, models) {
    cache.set(getCacheKey(userId, provider), {
        models,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}
function invalidateCachedModels(userId, provider) {
    cache.delete(getCacheKey(userId, provider));
}
