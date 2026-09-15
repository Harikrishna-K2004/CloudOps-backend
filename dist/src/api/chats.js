"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const chatService_1 = require("../services/chatService");
const messageService_1 = require("../services/messageService");
const aiChatService_1 = require("../services/aiChatService");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        const chats = await (0, chatService_1.getUserChats)(userId);
        return res.json({ chats });
    }
    catch (error) {
        console.error("Failed to get chats:", error);
        return res.status(500).json({
            error: "Failed to get chats",
        });
    }
});
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        const { title, provider, model, } = req.body;
        const chat = await (0, chatService_1.createChat)(userId, title, provider, model);
        return res.status(201).json({ chat });
    }
    catch (error) {
        console.error("Failed to create chat:", error);
        return res.status(500).json({
            error: "Failed to create chat",
        });
    }
});
router.post("/:chatId/title", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { message, provider, model } = req.body;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                error: "Chat ID is required",
            });
        }
        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Message is required",
            });
        }
        const chat = await (0, chatService_1.getChat)(userId, chatId);
        if (!chat) {
            return res.status(404).json({
                error: "Chat not found",
            });
        }
        const result = await (0, aiChatService_1.generateAIChatTitle)(userId, message, provider, model);
        const title = result.title.trim();
        if (!title) {
            return res.status(502).json({
                error: "AI generated an empty chat title",
            });
        }
        const updatedChat = await (0, chatService_1.updateChatTitle)(userId, chatId, title);
        return res.json({
            chat: updatedChat,
        });
    }
    catch (error) {
        console.error("Failed to generate chat title:", error);
        return res.status(502).json({
            error: error instanceof Error
                ? error.message
                : "Failed to generate chat title",
        });
    }
});
router.patch("/:chatId", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { title } = req.body;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                error: "Chat ID is required",
            });
        }
        if (typeof title !== "string" ||
            !title.trim()) {
            return res.status(400).json({
                error: "Chat title is required",
            });
        }
        const chat = await (0, chatService_1.updateChatTitle)(userId, chatId, title);
        return res.json({ chat });
    }
    catch (error) {
        console.error("Failed to update chat title:", error);
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to update chat title",
        });
    }
});
router.delete("/:chatId", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                error: "Chat ID is required",
            });
        }
        await (0, chatService_1.deleteChat)(userId, chatId);
        return res.json({
            success: true,
            chatId,
        });
    }
    catch (error) {
        console.error("Failed to delete chat:", error);
        return res.status(500).json({
            error: "Failed to delete chat",
        });
    }
});
router.get("/:chatId", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                error: "Chat ID is required",
            });
        }
        const chat = await (0, chatService_1.getChat)(userId, chatId);
        if (!chat) {
            return res.status(404).json({
                error: "Chat not found",
            });
        }
        return res.json({ chat });
    }
    catch (error) {
        console.error("Failed to get chat:", error);
        return res.status(500).json({
            error: "Failed to get chat",
        });
    }
});
router.get("/:chatId/messages", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                error: "Chat ID is required",
            });
        }
        const { data: chat, error: chatError } = await supabase_1.supabase
            .from("chats")
            .select("id")
            .eq("id", chatId)
            .eq("user_id", userId)
            .maybeSingle();
        if (chatError) {
            throw new Error(chatError.message);
        }
        if (!chat) {
            return res.status(404).json({
                error: "Chat not found",
            });
        }
        const messages = await (0, messageService_1.getChatMessages)(chatId);
        return res.json({ messages });
    }
    catch (error) {
        console.error("Failed to get messages:", error);
        return res.status(500).json({
            error: "Failed to get messages",
        });
    }
});
router.post("/:chatId/messages", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const { role, content } = req.body;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!chatId || typeof chatId !== "string") {
            return res.status(400).json({
                error: "Chat ID is required",
            });
        }
        if (!role ||
            !content ||
            typeof role !== "string" ||
            typeof content !== "string") {
            return res.status(400).json({
                error: "Role and content are required",
            });
        }
        const { data: chat, error: chatError } = await supabase_1.supabase
            .from("chats")
            .select("id")
            .eq("id", chatId)
            .eq("user_id", userId)
            .maybeSingle();
        if (chatError) {
            throw new Error(chatError.message);
        }
        if (!chat) {
            return res.status(404).json({
                error: "Chat not found",
            });
        }
        const message = await (0, messageService_1.addMessage)(chatId, role, content);
        return res.status(201).json({ message });
    }
    catch (error) {
        console.error("Failed to add message:", error);
        return res.status(500).json({
            error: "Failed to add message",
        });
    }
});
exports.default = router;
