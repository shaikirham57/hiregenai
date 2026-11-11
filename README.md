# HireGen AI

A recruitment SaaS demo: React + TypeScript frontend backed by a real Express + PostgreSQL API.

🔗 **Live demo:** https://hiregenai-eight.vercel.app

## Project structure

```
hiregen-ai/
├── frontend/                 🎨 FRONTEND — React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── features/         Pages (jobs, candidates, screening, interviews, analytics…)
│   │   ├── components/       Reusable UI components
│   │   ├── services/         Calls to the backend API
│   │   ├── contexts/         Auth, theme, and toast state
│   │   ├── hooks/            Custom React hooks
│   │   ├── lib/              Helpers (API client, utils)
│   │   └── types/            Shared TypeScript types
│   ├── public/               Static files (favicon, icons)
│   ├── index.html
│   ├── vite.config.ts
│   ├── Dockerfile            Builds the website and serves it with nginx
│   └── nginx.conf            Serves the site and forwards /api to the backend
│
├── backend/                  ⚙️ BACKEND — Node.js + Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── routes/           Endpoint list per resource (/api/auth, /api/jobs, …)
│   │   ├── controllers/      Request handlers for each endpoint
│   │   ├── services/         Business logic (resume screening, scoring, analytics…)
│   │   ├── validators/       Zod request schemas
│   │   ├── middleware/       Auth check and error handling
│   │   ├── config/           Environment variables and database client
│   │   ├── utils/            JWT, response serializers, HTTP helpers
│   │   ├── types/            Type declarations
│   │   ├── app.ts            Express app setup
│   │   └── index.ts          Local server entry point
│   ├── prisma/               Database schema, migrations, and seed data
│   └── Dockerfile            Builds and runs the API
│
├── api/index.ts              ☁️ Vercel serverless entry (runs the backend in production)
├── scripts/                  Build-time database migration script
├── vercel.json               Vercel deploy config
├── docker-compose.yml        Runs the database, API, and website with Docker
└── package.json              Root scripts and dependencies used by Vercel
```

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, React Hook Form, Zod, Recharts |
| Backend | Node.js, Express, Prisma ORM, PostgreSQL, JWT (httpOnly cookie), bcrypt, PDF.js, Mammoth |
| Deployment | Vercel (static frontend + serverless API), Docker (nginx + Node.js + PostgreSQL) |

## First-time setup

1. **Start PostgreSQL** (requires Docker Desktop running):

   ```
   docker compose up -d db
   ```

2. **Backend**:

   ```
   cd backend
   npm install
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

   The API runs at `http://localhost:4000`. `backend/.env` (copy from `backend/.env.example`) holds `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CLIENT_ORIGIN`.

3. **Frontend** (in a separate terminal, from the repo root):

   ```
   npm install
   npm run dev
   ```

   The app runs at `http://localhost:5173` and talks to the API via `VITE_API_URL` (see `frontend/.env`, defaults to `http://localhost:4000/api`).

## Run with Docker

Runs the whole app (website, API, and database) in containers. Requires Docker Desktop.

```
docker compose up -d --build
docker compose exec backend npm run seed     # first time only: loads the demo data
```

Open **http://localhost:8080**. The API applies database migrations automatically when it starts.

- If ports 8080 or 5432 are already in use, create a `.env` file next to `docker-compose.yml` with, for example, `WEB_PORT=8085` and `DB_PORT=5441`.
- To enable the AI job description generator, put `OPENROUTER_API_KEY` in `backend/.env`.
- Stop everything with `docker compose down` (add `-v` to also delete the database).

## Demo accounts

Seeded by `npm run seed` (in `backend/`):

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
