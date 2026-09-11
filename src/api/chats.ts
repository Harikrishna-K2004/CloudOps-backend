import { Router } from "express";
import { supabase } from "../config/supabase";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

import {
  createChat,
  getUserChats,
  deleteChat,
  getChat,
  updateChatTitle,
} from "../services/chatService";

import {
  addMessage,
  getChatMessages,
} from "../services/messageService";

import { generateAIChatTitle } from "../services/aiChatService";

const router = Router();

router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const chats = await getUserChats(userId);

      return res.json({ chats });
    } catch (error) {
      console.error("Failed to get chats:", error);

      return res.status(500).json({
        error: "Failed to get chats",
      });
    }
  },
);

router.post(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const {
        title,
        provider,
        model,
      } = req.body;

      const chat = await createChat(
        userId,
        title,
        provider,
        model,
      );

      return res.status(201).json({ chat });
    } catch (error) {
      console.error("Failed to create chat:", error);

      return res.status(500).json({
        error: "Failed to create chat",
      });
    }
  },
);


router.post(
  "/:chatId/title",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      const chat = await getChat(userId, chatId);

      if (!chat) {
        return res.status(404).json({
          error: "Chat not found",
        });
      }

      const result = await generateAIChatTitle(
        userId,
        message,
        provider,
        model,
      );

      const title = result.title.trim();

      if (!title) {
        return res.status(502).json({
          error: "AI generated an empty chat title",
        });
      }

      const updatedChat = await updateChatTitle(
        userId,
        chatId,
        title,
      );

      return res.json({
        chat: updatedChat,
      });
    } catch (error) {
      console.error(
        "Failed to generate chat title:",
        error,
      );

      return res.status(502).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate chat title",
      });
    }
  },
);


router.patch(
  "/:chatId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          error: "Chat title is required",
        });
      }

      const chat = await updateChatTitle(
        userId,
        chatId,
        title,
      );

      return res.json({ chat });
    } catch (error) {
      console.error(
        "Failed to update chat title:",
        error,
      );

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update chat title",
      });
    }
  },
);

router.delete(
  "/:chatId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      await deleteChat(userId, chatId);

      return res.json({
        success: true,
        chatId,
      });
    } catch (error) {
      console.error(
        "Failed to delete chat:",
        error,
      );

      return res.status(500).json({
        error: "Failed to delete chat",
      });
    }
  },
);

router.get(
  "/:chatId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      const chat = await getChat(userId, chatId);

      if (!chat) {
        return res.status(404).json({
          error: "Chat not found",
        });
      }

      return res.json({ chat });
    } catch (error) {
      console.error("Failed to get chat:", error);

      return res.status(500).json({
        error: "Failed to get chat",
      });
    }
  },
);


router.get(
  "/:chatId/messages",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      const { data: chat, error: chatError } =
        await supabase
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

      const messages = await getChatMessages(chatId);

      return res.json({ messages });
    } catch (error) {
      console.error(
        "Failed to get messages:",
        error,
      );

      return res.status(500).json({
        error: "Failed to get messages",
      });
    }
  },
);

router.post(
  "/:chatId/messages",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      if (
        !role ||
        !content ||
        typeof role !== "string" ||
        typeof content !== "string"
      ) {
        return res.status(400).json({
          error: "Role and content are required",
        });
      }

      const { data: chat, error: chatError } =
        await supabase
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

      const message = await addMessage(
        chatId,
        role,
        content,
      );

      return res.status(201).json({ message });
    } catch (error) {
      console.error(
        "Failed to add message:",
        error,
      );

      return res.status(500).json({
        error: "Failed to add message",
      });
    }
  },
);

export default router;