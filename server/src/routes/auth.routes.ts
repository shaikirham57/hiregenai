import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, signToken } from "../lib/jwt.js";
import { serializeUser } from "../lib/serialize.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";

export const authRouter = Router();

const roleSchema = z.enum(["recruiter", "candidate"]);

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: roleSchema,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: roleSchema,
});

const AVATAR_COLORS = [
  "#0053FE", "#6E1EEE", "#14296B", "#1F9D55", "#D9A404",
  "#0A1D50", "#8A47F2", "#2E71FE", "#D92D20", "#5B6472",
];
function colorForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with this email already exists.");

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
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password, role } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== role) throw new HttpError(401, "Invalid email or password.");

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
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...AUTH_COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).end();
});
