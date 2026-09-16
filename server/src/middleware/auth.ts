import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifyToken, type AuthTokenPayload } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

export function requireRole(role: "recruiter" | "candidate") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) {
      res.status(403).json({ error: "You do not have access to this resource." });
      return;
    }
    next();
  };
}
