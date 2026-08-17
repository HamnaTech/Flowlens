# FlowLens Deployment Guide

This guide walks you through deploying the FlowLens full-stack application:

```
GitHub repository
        ↓
 ┌───────────────┐
 │               │
Vercel          Render
Frontend        Backend
                  ↓
             PostgreSQL
                  +
                Redis
```

---

## 1. Architecture Overview

| Layer | Technology | Host |
|-------|-----------|------|
| Frontend | React 18 + Vite 5 + TypeScript + React Router (SPA) | Vercel |
| Backend | NestJS 10 (Express) + Prisma 5 | Render |
| Database | PostgreSQL 15+ (requires **pgvector** extension) | Render PostgreSQL / Neon / Supabase |
| Cache + Jobs | Redis (cache-manager + BullMQ) | Upstash / Redis Cloud / Render Redis |
| File storage | S3-compatible or Cloudinary | AWS S3 / Cloudinary |
| AI | OpenAI / Gemini / Groq | External API |

**Important:** The BullMQ workers (AI analysis, report generation, notifications, attachment processing) run **embedded inside the main NestJS app process** (`src/modules/jobs/queue.module.ts`). There is **no separate worker service** — a single Render web service handles both the API and background jobs.

---

## 2. Prerequisites

- A GitHub repository containing this project (the git repo root is `flowlens-backend-fixed final`)
- Accounts for: [Vercel](https://vercel.com), [Render](https://render.com), a PostgreSQL provider, a Redis provider
- Node.js 20+ locally

---

## 3. Environment Variables

### Backend (Render) — set in Render dashboard

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Render injects this automatically; set to `4000` as fallback |
| `API_PREFIX` | Yes | `api` |
| `API_DEFAULT_VERSION` | Yes | `1` |
| `CORS_ORIGINS` | Yes | Your Vercel frontend URL, e.g. `https://flowlens.vercel.app` (comma-separated for multiple) |
| `DATABASE_URL` | Yes | From your PostgreSQL provider (see §4) |
| `DATABASE_POOL_MAX` | No | `20` (default) |
| `REDIS_HOST` | Yes | From your Redis provider (see §5) |
| `REDIS_PORT` | Yes | From your Redis provider (usually `6379` or `6380`) |
| `REDIS_PASSWORD` | Yes* | From your Redis provider (*required by most managed providers) |
| `REDIS_TLS` | Yes | `true` for managed providers (Upstash, Redis Cloud, Render Redis); `false` for local |
| `REDIS_CACHE_TTL_SECONDS` | No | `60` (default) |
| `JWT_ACCESS_SECRET` | Yes | Generate: `openssl rand -base64 48` (must be ≥32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` (default) |
| `JWT_REFRESH_SECRET` | Yes | Generate: `openssl rand -base64 48` (must be ≥32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` (default) |
| `PASSWORD_HASH_MEMORY_COST` | No | `19456` (default) |
| `PASSWORD_HASH_TIME_COST` | No | `2` (default) |
| `STORAGE_PROVIDER` | No | `s3` or `cloudinary` (default `s3`) |
| `MAX_UPLOAD_SIZE_MB` | No | `50` (default) |
| `AI_PROVIDER` | No | `openai` (default) |
| `THROTTLE_TTL_SECONDS` | No | `60` (default) |
| `THROTTLE_LIMIT` | No | `100` (default) |
| `LOG_LEVEL` | No | `info` (default) |

**Optional** (only if you use these features):

| Variable | Where to get it |
|----------|-----------------|
| `OPENAI_API_KEY` | [OpenAI platform](https://platform.openai.com) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |
| `GROQ_API_KEY` | [Groq console](https://console.groq.com) |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` | AWS S3 (or S3-compatible like Cloudflare R2) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [Cloudinary dashboard](https://cloudinary.com) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Your email provider (SendGrid, Mailgun, etc.) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | [Stripe dashboard](https://dashboard.stripe.com) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | [Google Cloud Console](https://console.cloud.google.com) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | [GitHub OAuth Apps](https://github.com/settings/developers) |

### Frontend (Vercel) — set in Vercel dashboard

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `VITE_API_BASE_URL` | Yes | Your Render backend URL + `/api/v1`, e.g. `https://flowlens-backend.onrender.com/api/v1` |

> **Note:** Vite only exposes variables prefixed with `VITE_` to the browser. Set this in Vercel's **Settings → Environment Variables**, never in a committed file.

---

## 4. PostgreSQL Setup

The schema requires the **pgvector** extension (`CREATE EXTENSION IF NOT EXISTS vector` in the migration).

**Option A — Render PostgreSQL (simplest):**
1. In Render dashboard → **New → PostgreSQL**
2. Choose a plan (free tier available)
3. After creation, copy the **Internal Database URL** (for Render-to-Render connections) or **External Database URL** (for local/other connections)
4. **pgvector is NOT pre-installed on Render PostgreSQL.** You must run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   via the Render database shell or a SQL client.

**Option B — Neon (serverless Postgres with pgvector):**
1. Create a project at [neon.tech](https://neon.tech)
2. Neon supports pgvector natively — no extra setup needed
3. Copy the connection string (use the **pooled** connection string for serverless)

**Option C — Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Enable the `vector` extension in **Database → Extensions**
3. Copy the connection string

Set `DATABASE_URL` to your connection string in Render.

---

## 5. Redis Setup

The app uses Redis for:
- **Caching** (`cache-manager-redis-yet`)
- **BullMQ queues** (AI analysis, report generation, notifications, attachment processing)

**Option A — Upstash (recommended, free tier):**
1. Create an account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the **host**, **port**, and **password** from the dashboard
4. Set in Render:
   - `REDIS_HOST` = host from Upstash
   - `REDIS_PORT` = port from Upstash
   - `REDIS_PASSWORD` = password from Upstash
   - `REDIS_TLS` = `true`

**Option B — Render Redis:**
1. In Render dashboard → **New → Redis**
2. Copy the connection details
3. Set `REDIS_TLS=true` (Render Redis uses TLS)

**Option C — Redis Cloud:**
1. Create a database at [redis.com](https://redis.com)
2. Set `REDIS_TLS=true`

---

## 6. Deploy Backend to Render

### Option A — Blueprint (recommended, uses `render.yaml`)

1. Push your code to GitHub
2. In Render dashboard → **New → Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates the service automatically
5. Set the `sync: false` environment variables (marked in the blueprint) in the Render dashboard:
   - `DATABASE_URL`, `REDIS_HOST`, `REDIS_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - Plus any optional vars you need
6. Update `CORS_ORIGINS` to your actual Vercel URL
7. Deploy

### Option B — Manual Web Service

1. In Render dashboard → **New → Web Service**
2. Connect your GitHub repo
3. **Root Directory:** `flowlens-backend-fixed final`
4. **Build Command:**
   ```
   npm install && npx prisma generate && npm run build
   ```
5. **Start Command:**
   ```
   npm run start:prod
   ```
6. **Health Check Path:** `/health`
7. Add all environment variables from §3
8. Deploy

---

## 7. Run Production Database Migrations

After the backend is deployed (or before first deploy), run:

```bash
npx prisma migrate deploy
```

This applies the existing migration (`20260809101350_initial_setup`) to the production database **without resetting or deleting data**.

**Where to run it:**
- **Locally** (with `DATABASE_URL` pointing to production): `npx prisma migrate deploy`
- **On Render**: Use the Render **Shell** tab for your service, then run `npx prisma migrate deploy`

> ⚠️ **Never** run `prisma migrate reset` or `prisma migrate dev` against production — these can destroy data.

---

## 8. Deploy Frontend to Vercel

1. Push your code to GitHub
2. In Vercel dashboard → **Add New → Project**
3. Import your GitHub repo
4. **Root Directory:** `flowlens-backend-fixed final/flowlens-frontend`
5. **Framework Preset:** Vite (auto-detected)
6. **Build Command:** `npm run build` (default)
7. **Output Directory:** `dist` (default)
8. **Environment Variables:**
   - `VITE_API_BASE_URL` = `https://your-render-backend.onrender.com/api/v1`
9. Deploy

The `vercel.json` file (already created) handles SPA routing so deep links like `/dashboard` work correctly.

---

## 9. CORS Configuration

1. After deploying the frontend, copy its URL (e.g. `https://flowlens.vercel.app`)
2. In Render, set:
   ```
   CORS_ORIGINS=https://flowlens.vercel.app
   ```
3. Redeploy the backend (or it auto-deploys if connected to GitHub)

> **Security note:** In production, an empty `CORS_ORIGINS` disables CORS entirely — no browser client can reach the API. This is intentional, not a fallback.

---

## 10. Authentication Notes

- **Tokens:** JWT access + refresh tokens stored in `localStorage` (not cookies)
- **Authorization:** `Authorization: Bearer <accessToken>` header
- **Refresh:** `POST /api/v1/auth/refresh` with `{ refreshToken }` in body
- **CORS:** `credentials: true` is set, but since tokens are in headers (not cookies), no special cookie settings are needed
- **No changes to auth security were made** — production uses the same flow as local

---

## 11. Final Testing Checklist

1. ✅ `https://your-frontend.vercel.app` loads
2. ✅ Register a new account
3. ✅ Login works
4. ✅ Dashboard loads (requires auth)
5. ✅ Create a frustration log
6. ✅ Check `/health` on Render returns `{"status":"ok"}`
7. ✅ Deep link (e.g. `/dashboard`) works on Vercel (SPA routing)
8. ✅ Background jobs process (check Render logs for BullMQ activity)

---

## 12. Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| CORS error in browser | `CORS_ORIGINS` doesn't match Vercel URL | Update `CORS_ORIGINS` in Render to exact frontend URL |
| `DATABASE_URL` validation error | Missing/invalid connection string | Ensure `DATABASE_URL` is set and starts with `postgresql://` |
| `REDIS_HOST` validation error | Missing Redis config | Set `REDIS_HOST` (required by Joi validation) |
| `JWT_ACCESS_SECRET` too short | Secret < 32 chars | Generate a longer secret with `openssl rand -base64 48` |
| pgvector error on migration | Extension not installed | Run `CREATE EXTENSION IF NOT EXISTS vector;` on the database |
| 404 on deep links | SPA routing not configured | Ensure `vercel.json` is present in `flowlens-frontend/` |
| Backend won't start | Missing required env var | Check Render logs; Joi validation reports all missing vars at boot |
| Redis connection refused | Wrong host/port or TLS | Verify `REDIS_HOST`/`REDIS_PORT`; set `REDIS_TLS=true` for managed providers |