"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const aiChatService_1 = require("../services/aiChatService");
const aiServerService_1 = require("../services/aiServerService");
const router = (0, express_1.Router)();
router.post("/chat", auth_1.requireAuth, async (req, res) => {
    try {
        const { message, provider, model, tools } = req.body;
        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Message is required",
            });
        }
        const result = await (0, aiChatService_1.sendAIChat)(req.userId, message, provider, model, tools);
        return res.json(result);
    }
    catch (error) {
        console.error("AI chat error:", error);
        if (error instanceof aiServerService_1.AIProviderError) {
            return res.status(error.status).json({
                error: error.message,
            });
        }
        return res.status(502).json({
            error: "AI server unavailable",
        });
    }
});
exports.default = router;
