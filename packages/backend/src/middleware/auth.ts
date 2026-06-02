import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: number;
  role: string;
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string };
    }
  }
}

// requireAuth: fails if no valid token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required", statusCode: 401 });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token", statusCode: 401 });
  }
}

// optionalAuth: attaches user if token valid, doesn't fail
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // silently ignore invalid tokens
  }
  next();
}
