"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderError = void 0;
exports.sendToAIServer = sendToAIServer;
exports.generateChatTitle = generateChatTitle;
const env_1 = require("../config/env");
class AIProviderError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = "AIProviderError";
        this.status = status;
    }
}
exports.AIProviderError = AIProviderError;
async function sendToAIServer(request) {
    const response = await fetch(`${env_1.env.aiServerUrl}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...request,
            api_key: request.apiKey,
            tool_credentials: request.toolCredentials,
        }),
    });
    if (!response.ok) {
        const errorBody = await response
            .json()
            .catch(() => null);
        throw new AIProviderError(errorBody?.detail ||
            errorBody?.error ||
            `AI server returned status ${response.status}`, response.status);
    }
    return response.json();
}
async function generateChatTitle(request) {
    const response = await fetch(`${env_1.env.aiServerUrl}/api/title`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...request,
            api_key: request.apiKey,
        }),
    });
    if (!response.ok) {
        const errorBody = await response
            .json()
            .catch(() => null);
        throw new AIProviderError(errorBody?.detail ||
            errorBody?.error ||
            `AI server returned status ${response.status}`, response.status);
    }
    return response.json();
}
