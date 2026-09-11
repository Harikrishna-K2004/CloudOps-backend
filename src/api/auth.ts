import { Router } from "express";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

router.get(
  "/me",
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    res.json({
      id: req.userId,
    });
  },
);

export default router;