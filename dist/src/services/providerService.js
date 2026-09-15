"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIProviders = getAIProviders;
const env_1 = require("../config/env");
async function getAIProviders() {
    const response = await fetch(`${env_1.env.aiServerUrl}/api/providers`, {
        method: "GET",
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ||
            errorBody?.error ||
            `AI server returned status ${response.status}`);
    }
    return response.json();
}
