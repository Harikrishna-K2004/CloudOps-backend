import { Router } from "express";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";
import { getAvailableModels } from "../services/modelService";
import { AIProviderError} from "../services/aiServerService";
import { getAIProviders } from "../services/providerService";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await getAIProviders();

    return res.json(result);
  } catch (error) {
    console.error("Provider discovery error:", error);

    return res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch providers",
    });
  }
});

router.get(
  "/:provider",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const provider = req.params.provider;

      if (!provider || typeof provider !== "string") {
        return res.status(400).json({
          error: "Provider is required",
        });
      }

      const result = await getAvailableModels(
        req.userId!,
        provider,
      );

      return res.json(result);
    } 
    catch (error) {
      console.error("Model discovery error:", error);

      if (error instanceof AIProviderError) {
        return res.status(error.status).json({
          error: error.message,
        });
      }

      return res.status(502).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch models",
      });
    }
  },
);

export default router;