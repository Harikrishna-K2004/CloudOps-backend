import { Router } from "express";
import { supabase } from "../config/supabase";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

import { saveModelToken } from "../services/modelTokenService";
import { invalidateCachedCredential } from "../services/credentialCache";
import { invalidateCachedModels } from "../services/modelCache";

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
        .from("model_api_tokens")
        .select("provider, is_configured")
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      return res.json(
        data.map((item) => ({
          provider: item.provider,
          isConfigured: item.is_configured,
        })),
      );
    } catch (error) {
      console.error(
        "Failed to get configured models:",
        error,
      );

      return res.status(500).json({
        error: "Failed to get configured models",
      });
    }
  },
);

router.post(
  "/:provider",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      const result = await saveModelToken(
        userId,
        provider,
        token,
      );

      invalidateCachedCredential(userId, provider);
      invalidateCachedModels(userId, provider);

      return res.status(201).json({
        id: result.id,
        provider: result.provider,
        isConfigured: result.is_configured,
      });
    } catch (error) {
      console.error("Failed to save model token:", error);

      return res.status(500).json({
        error: "Failed to save model token",
      });
    }
  },
);

router.delete(
  "/:provider",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
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

      const { error } = await supabase
        .from("model_api_tokens")
        .delete()
        .eq("user_id", userId)
        .eq("provider", provider);

      if (error) {
        throw new Error(error.message);
      }

      invalidateCachedCredential(userId, provider);
      invalidateCachedModels(userId, provider);

      return res.json({
        success: true,
        provider,
      });
    } catch (error) {
      console.error(
        "Failed to delete model token:",
        error,
      );

      return res.status(500).json({
        error: "Failed to delete model token",
      });
    }
  },
);

export default router;