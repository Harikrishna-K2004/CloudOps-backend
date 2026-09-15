"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableModels = getAvailableModels;
const modelTokenService_1 = require("./modelTokenService");
const credentialCache_1 = require("./credentialCache");
const modelCache_1 = require("./modelCache");
const env_1 = require("../config/env");
async function getProviderCredential(userId, provider) {
    if (provider === "ollama") {
        return null;
    }
    const cachedCredential = (0, credentialCache_1.getCachedCredential)(userId, provider);
    if (cachedCredential) {
        return cachedCredential;
    }
    const apiKey = await (0, modelTokenService_1.getModelToken)(userId, provider);
    if (!apiKey) {
        throw new Error(`No API key configured for provider: ${provider}`);
    }
    (0, credentialCache_1.setCachedCredential)(userId, provider, apiKey);
    return apiKey;
}
async function getAvailableModels(userId, provider) {
    const cachedModels = (0, modelCache_1.getCachedModels)(userId, provider);
    if (cachedModels) {
        return {
            provider,
            models: cachedModels,
            cached: true,
        };
    }
    const apiKey = await getProviderCredential(userId, provider);
    const response = await fetch(`${env_1.env.aiServerUrl}/api/models/${provider}`, {
        method: "GET",
        headers: {
            ...(apiKey
                ? {
                    Authorization: `Bearer ${apiKey}`,
                }
                : {}),
        },
    });
    if (!response.ok) {
        throw new Error(`AI server returned status ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
        throw new Error(result.error);
    }
    (0, modelCache_1.setCachedModels)(userId, provider, result.models);
    return {
        ...result,
        cached: false,
    };
}
