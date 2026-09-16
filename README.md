# HireGen AI

A recruitment SaaS demo: React + TypeScript frontend backed by a real Express + PostgreSQL API.

## Project layout

- `/` — Vite + React frontend (unchanged UI/design)
- `/server` — Express + Prisma + PostgreSQL backend
- `docker-compose.yml` — local PostgreSQL container

## First-time setup

1. **Start PostgreSQL** (requires Docker Desktop running):

   ```
   docker compose up -d
   ```

2. **Backend**:

   ```
   cd server
   npm install
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

   The API runs at `http://localhost:4000`. `server/.env` (copy from `.env.example`) holds `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CLIENT_ORIGIN`.

3. **Frontend** (in a separate terminal, from the repo root):

   ```
   npm install
   npm run dev
   ```

   The app runs at `http://localhost:5173` and talks to the API via `VITE_API_URL` (see `.env`, defaults to `http://localhost:4000/api`).

## Demo accounts

Seeded by `npm run seed` (in `server/`):

| Role | Email | Password |
| --- | --- | --- |
| Recruiter | dana.whitfield@hiregen.ai | password123 |
| Candidate | alex.rivera@example.com | password123 |

New accounts can also be created from the app's Register page.

## Notes

- Authentication uses a JWT stored in an httpOnly cookie; passwords are hashed with bcrypt.
- All data (jobs, candidates, applications, assessments, interviews, notifications) is persisted in PostgreSQL — nothing is in-memory or mocked anymore.
- The "AI" fit-scoring and resume-screening logic are the same deterministic, hash-seeded heuristics the app always used for its demo — now computed server-side instead of client-side.
- Analytics are computed live from the current database state rather than a static snapshot.
