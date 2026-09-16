import { PrismaClient } from "@prisma/client";

// Cache the client on `globalThis` so serverless cold starts that reuse a warm
// Node.js runtime (Vercel) don't spawn a fresh PrismaClient (and DB connection)
// on every invocation. Harmless for the long-running server (VPS/local) too.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
