import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { sendAIChat } from "../services/aiChatService";
import { AIProviderError } from "../services/aiServerService";

const router = Router();

router.post(
  "/chat",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message, provider, model, tools } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({
          error: "Message is required",
        });
      }

      const result = await sendAIChat(
        req.userId!,
        message,
        provider,
        model,
        tools,
      );

      return res.json(result);
    } 
    catch (error) {
      console.error("AI chat error:", error);

      if (error instanceof AIProviderError) {
        return res.status(error.status).json({
          error: error.message,
        });
      }

      return res.status(502).json({
        error: "AI server unavailable",
      });
    }
  },
);

export default router;