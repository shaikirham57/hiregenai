// Runs during the Vercel build: applies Prisma migrations to the production
// database. It deliberately does NOT run prisma/seed.ts: seeding on every
// deploy re-inserted the demo jobs (job-1 .. job-6) and their demo candidates,
// applications, assessments, and interviews into production. The seed script
// is for local development only (`npm run seed` in server/).
// Skips with a warning when DATABASE_URL isn't configured, so the frontend
// still deploys before a database has been attached to the project.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("[db-setup] DATABASE_URL is not set; skipping migrations.");
  process.exit(0);
}

execSync("npx prisma migrate deploy --schema=server/prisma/schema.prisma", { stdio: "inherit" });
