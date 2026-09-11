import { Router } from "express";
import { supabase } from "../config/supabase";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

import {
  saveToolSecret,
} from "../services/toolSecretService";

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

      const { data, error } = await supabase
        .from("tool_secrets")
        .select("tool_id, is_configured")
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      return res.json({
        tools: data.map((item) => ({
          toolId: item.tool_id,
          isConfigured: item.is_configured,
        })),
      });
    } catch (error) {
      console.error(
        "Failed to get configured tools:",
        error,
      );

      return res.status(500).json({
        error: "Failed to get configured tools",
      });
    }
  },
);

router.post(
  "/:toolId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;
      const { toolId } = req.params;
      const { credentials } = req.body;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (!toolId || typeof toolId !== "string") {
        return res.status(400).json({
          error: "Tool ID is required",
        });
      }

      if (
        !credentials ||
        typeof credentials !== "string"
      ) {
        return res.status(400).json({
          error: "Credentials are required",
        });
      }

      const result = await saveToolSecret(
        userId,
        toolId,
        credentials,
      );

      return res.status(201).json({
        id: result.id,
        toolId: result.tool_id,
        isConfigured: result.is_configured,
      });
    } catch (error) {
      console.error(
        "Failed to save tool secret:",
        error,
      );

      return res.status(500).json({
        error: "Failed to save tool secret",
      });
    }
  },
);

router.delete(
  "/:toolId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;
      const { toolId } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (!toolId) {
        return res.status(400).json({
          error: "Tool ID is required",
        });
      }

      const { error } = await supabase
        .from("tool_secrets")
        .delete()
        .eq("user_id", userId)
        .eq("tool_id", toolId);

      if (error) {
        throw new Error(error.message);
      }

      return res.json({
        success: true,
        toolId,
      });
    } catch (error) {
      console.error(
        "Failed to delete tool secret:",
        error,
      );

      return res.status(500).json({
        error: "Failed to delete tool secret",
      });
    }
  },
);

export default router;