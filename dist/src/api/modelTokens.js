"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const modelTokenService_1 = require("../services/modelTokenService");
const credentialCache_1 = require("../services/credentialCache");
const modelCache_1 = require("../services/modelCache");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        const { data, error } = await supabase_1.supabase
            .from("model_api_tokens")
            .select("provider, is_configured")
            .eq("user_id", userId);
        if (error) {
            throw new Error(error.message);
        }
        return res.json(data.map((item) => ({
            provider: item.provider,
            isConfigured: item.is_configured,
        })));
    }
    catch (error) {
        console.error("Failed to get configured models:", error);
        return res.status(500).json({
            error: "Failed to get configured models",
        });
    }
});
router.post("/:provider", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { provider } = req.params;
        const { token } = req.body;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!token || typeof token !== "string") {
            return res.status(400).json({
                error: "Token is required",
            });
        }
        if (!provider || typeof provider !== "string") {
            return res.status(400).json({
                error: "Provider is required",
            });
        }
        const result = await (0, modelTokenService_1.saveModelToken)(userId, provider, token);
        (0, credentialCache_1.invalidateCachedCredential)(userId, provider);
        (0, modelCache_1.invalidateCachedModels)(userId, provider);
        return res.status(201).json({
            id: result.id,
            provider: result.provider,
            isConfigured: result.is_configured,
        });
    }
    catch (error) {
        console.error("Failed to save model token:", error);
        return res.status(500).json({
            error: "Failed to save model token",
        });
    }
});
router.delete("/:provider", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { provider } = req.params;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!provider || typeof provider !== "string") {
            return res.status(400).json({
                error: "Provider is required",
            });
        }
        const { error } = await supabase_1.supabase
            .from("model_api_tokens")
            .delete()
            .eq("user_id", userId)
            .eq("provider", provider);
        if (error) {
            throw new Error(error.message);
        }
        (0, credentialCache_1.invalidateCachedCredential)(userId, provider);
        (0, modelCache_1.invalidateCachedModels)(userId, provider);
        return res.json({
            success: true,
            provider,
        });
    }
    catch (error) {
        console.error("Failed to delete model token:", error);
        return res.status(500).json({
            error: "Failed to delete model token",
        });
    }
});
exports.default = router;
