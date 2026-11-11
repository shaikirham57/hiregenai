import { z } from "zod";
import { roleSchema } from "./common.schemas.js";

// Emails are stored lowercase so sign-in isn't case-sensitive.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
  password: z.string().min(6),
  role: roleSchema,
});

// The role picked on the login page is ignored: users sign in with the role
// they registered with, so picking the wrong tab no longer blocks them.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  role: roleSchema.optional(),
});
