// Runs during the Vercel build: applies Prisma migrations and seeds the demo
// accounts (the seed only uses upserts, so re-running it is harmless).
// Skips with a warning when DATABASE_URL isn't configured, so the frontend
// still deploys before a database has been attached to the project.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("[db-setup] DATABASE_URL is not set; skipping migrations and seed.");
  process.exit(0);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
run("npx prisma migrate deploy --schema=server/prisma/schema.prisma");
run("node server/prisma/seed.ts");
