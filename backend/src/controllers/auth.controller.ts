import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, signToken } from "../utils/jwt.js";
import { serializeUser } from "../utils/serializers.js";
import { colorForSeed } from "../utils/avatar.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { loginSchema, registerSchema } from "../validators/auth.schemas.js";

// Older accounts may have been saved with capital letters in the email.
function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = registerSchema.parse(req.body);

  const existing = await findUserByEmail(email);
  if (existing) throw new HttpError(409, "An account with this email already exists. Please log in instead.");

  const passwordHash = await bcrypt.hash(password, 10);
  const id = `user-${role}-${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      passwordHash,
      role,
      title: role === "recruiter" ? "Recruiter" : "Job Seeker",
      avatarColor: colorForSeed(id),
    },
  });

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  res.status(201).json(serializeUser(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await findUserByEmail(email);
  if (!user) throw new HttpError(401, "Invalid email or password.");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password.");

  // Record the login for the owner's login history. A failure here must not
  // block the user from signing in, so it is logged and otherwise ignored.
  const forwardedFor = req.headers["x-forwarded-for"];
  const ipAddress =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    null;
  try {
    await prisma.loginEvent.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ipAddress,
        userAgent: req.headers["user-agent"]?.slice(0, 500) ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to record login event:", err);
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  res.json(serializeUser(user));
});

export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { ...AUTH_COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).end();
}
