import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing authorization token",
    });
  }

  const token = authorization.substring(7);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }

  req.userId = user.id;

  next();
}