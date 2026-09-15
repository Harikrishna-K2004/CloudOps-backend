"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAIChat = sendAIChat;
exports.generateAIChatTitle = generateAIChatTitle;
const credentialCache_1 = require("./credentialCache");
const modelTokenService_1 = require("./modelTokenService");
const toolConnectionService_1 = require("./toolConnectionService");
const aiServerService_1 = require("./aiServerService");
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
async function getToolCredentials(userId) {
    const connections = await (0, toolConnectionService_1.getUserToolConnections)(userId);
    const credentials = {};
    for (const connection of connections) {
        if (!connection.providerId) {
            continue;
        }
        credentials[connection.providerId] =
            connection.credentials;
    }
    return credentials;
}
async function sendAIChat(userId, message, provider, model, tools) {
    const selectedProvider = provider ?? "ollama";
    const apiKey = await getProviderCredential(userId, selectedProvider);
    const toolCredentials = await getToolCredentials(userId);
    return (0, aiServerService_1.sendToAIServer)({
        userId,
        message,
        provider: selectedProvider,
        model,
        apiKey: apiKey ?? undefined,
        toolCredentials,
    });
}
async function generateAIChatTitle(userId, message, provider, model) {
    const selectedProvider = provider ?? "ollama";
    const apiKey = await getProviderCredential(userId, selectedProvider);
    return (0, aiServerService_1.generateChatTitle)({
        userId,
        message,
        provider: selectedProvider,
        model,
        apiKey: apiKey ?? undefined,
    });
}
