import jwt from "jsonwebtoken";
import { env } from "./env.js";

export interface AuthTokenPayload {
  sub: string;
  role: "recruiter" | "candidate";
}

const COOKIE_NAME = "hiregen_token";
const EXPIRES_IN = "7d";

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.cookieSecure,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
