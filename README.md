# FlowLens AI — Backend

Production-ready NestJS + Prisma + PostgreSQL + Redis backend for FlowLens AI.

## Status

This backend was built and statically verified module-by-module (see below), but
**has not been compiled or run**, because the environment it was built in has no
network access and therefore no `node_modules`. Every relative import (208 of
them), the full DI dependency graph, and the Prisma schema were checked by hand.
One real Prisma relation bug and several dependency/wiring issues were found and
fixed during that review — see git history / prior conversation for the full
audit trail. Treat first boot locally as the real first compile.

## Modules included

Auth (JWT + refresh rotation + RBAC) · Users · Organizations · Teams ·
Frustration Logs (core feature) · Categories · AI (OpenAI/Gemini/Groq,
swappable) · Notifications · Storage (S3/Cloudinary, swappable) · Background
jobs (BullMQ: AI analysis, report generation, notifications, attachment
processing) · Health check

**Not yet built:** Analytics/Dashboard aggregates, Billing/Stripe integration, Community Insights, third-party Integrations.
Schema support exists for all of these; service/controller logic does not yet.

## Setup

```bash
cp .env.example .env
# Edit .env — at minimum set:
#   JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (32+ chars each)
#   DATABASE_URL (PostgreSQL, with the pgvector extension available)
#   REDIS_HOST / REDIS_PORT
#   An AI provider key (OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY)

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run build
npm run start:dev
```

Then in a second terminal:

```bash
curl http://localhost:4000/health
open http://localhost:4000/docs   # Swagger UI
```

## Architecture notes

- Global guards run in this order: `ThrottlerGuard` → `JwtAuthGuard` →
  `RolesGuard` → `OrgRolesGuard`. The latter two no-op on routes without
  `@Roles()`/`@OrgRoles()` metadata, so they're safe to run globally.
- Two-tier RBAC: `PlatformRole` (USER/ADMIN, platform-wide) is independent of
  `OrgRole` (OWNER/ADMIN/MEMBER, per-organization).
- AI analysis never runs synchronously in the request path. Logging a
  frustration returns immediately with a deterministic preliminary Friction
  Score; the real LLM-derived score is computed by a BullMQ worker seconds
  later.
- Soft-delete throughout (`deletedAt` on logs, `isActive` on categories) —
  nothing is hard-deleted where historical data (AI reports, past logs) could
  be invalidated by it.
