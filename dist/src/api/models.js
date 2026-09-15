"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const modelService_1 = require("../services/modelService");
const aiServerService_1 = require("../services/aiServerService");
const providerService_1 = require("../services/providerService");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, async (_req, res) => {
    try {
        const result = await (0, providerService_1.getAIProviders)();
        return res.json(result);
    }
    catch (error) {
        console.error("Provider discovery error:", error);
        return res.status(502).json({
            error: error instanceof Error
                ? error.message
                : "Failed to fetch providers",
        });
    }
});
router.get("/:provider", auth_1.requireAuth, async (req, res) => {
    try {
        const provider = req.params.provider;
        if (!provider || typeof provider !== "string") {
            return res.status(400).json({
                error: "Provider is required",
            });
        }
        const result = await (0, modelService_1.getAvailableModels)(req.userId, provider);
        return res.json(result);
    }
    catch (error) {
        console.error("Model discovery error:", error);
        if (error instanceof aiServerService_1.AIProviderError) {
            return res.status(error.status).json({
                error: error.message,
            });
        }
        return res.status(502).json({
            error: error instanceof Error
                ? error.message
                : "Failed to fetch models",
        });
    }
});
exports.default = router;
