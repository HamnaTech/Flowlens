# FlowLens AI

**AI-powered frustration tracking and workflow intelligence platform.**

FlowLens helps teams capture frustrating moments in their workflows, analyze the underlying friction, and turn recurring problems into actionable insights.

> 🚀 **Full-stack application** — NestJS API + React SPA with AI analysis, friction scoring, team workspaces, and background processing.

---

## Project Preview

<!-- Add screenshots or a demo GIF here -->
### Dashboard view
![Dashboard](https://via.placeholder.com/1200x600?text=FlowLens+Dashboard+Preview)

### Frustration log detail
![Log Detail](https://via.placeholder.com/1200x600?text=FlowLens+Log+Detail+Preview)

> Replace the placeholder images above with real screenshots of your running app.

---

## What is FlowLens AI?

FlowLens is a **productivity friction tracker** — a tool that lets individuals and teams log moments where their workflow gets stuck, frustrating, or time-consuming. Instead of letting these annoyances accumulate silently, FlowLens captures them, analyzes them with AI, and surfaces the patterns that matter most.

- **Individuals** can track their own friction points, see what's costing them time, and get AI-generated suggestions for improvement.
- **Teams** can collaborate in shared workspaces, see org-wide friction trends, and identify systemic bottlenecks.

The goal is simple: **make the invisible costs of bad workflows visible and fixable.**

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🗒️ **Frustration logging** | Capture frustrations with descriptions, severity levels (1–10), time lost, category, tags, source (text/voice/screenshot), and optional attachments |
| 🤖 **AI-powered analysis** | Logs are analyzed by AI (OpenAI, Gemini, or Groq — swappable) for category suggestions, severity/preventability scoring, and auto-tagging |
| 📊 **Friction scoring** | A 0–100 score computed from severity, frequency, time lost, and preventability — giving every frustration an at-a-glance impact metric |
| 🗂️ **Categories** | User- and org-scoped categories with custom colors/icons; system-seeded defaults; soft-archiving |
| 📋 **AI reports** | Daily/weekly/monthly natural-language summaries with actionable recommendations and burnout-risk scoring |
| 🔐 **Authentication & RBAC** | JWT access/refresh tokens with rotation, email verification, password reset, login lockout, and two-tier role-based access control |
| 🏢 **Organizations & teams** | Shared workspaces with invite links, member management, and per-org roles (OWNER / ADMIN / MEMBER) |
| 🔔 **Notifications** | In-app notification system with read/unread state; email notifications for key events |
| ⚙️ **Background processing** | BullMQ + Redis queues for AI analysis, report generation, notification dispatch, and attachment processing |
| 🗄️ **File/storage support** | Swappable storage adapters (S3-compatible or Cloudinary) for avatars and log attachments |

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS 10** | Application framework (modular, dependency-injected) |
| **TypeScript 5** | Language |
| **Prisma 5** | ORM with PostgreSQL schema management & migrations |
| **PostgreSQL 15+** | Primary database (with **pgvector** extension for embeddings) |
| **Redis** | Caching + BullMQ job queue broker |
| **BullMQ** | Background job processing (AI analysis, reports, notifications, attachments) |
| **JWT + Passport** | Authentication & authorization |
| **Argon2** | Password hashing (OWASP-recommended) |
| **OpenAI / Gemini / Groq** | Swappable AI providers via a provider abstraction |
| **Helmet** | Security headers |
| **Swagger / OpenAPI** | Auto-generated API documentation |
| **Pino** | Structured logging |
| **@nestjs/throttler** | API rate limiting |
| **Nodemailer** | Email transport (verification, password reset, notifications) |
| **AWS SDK / Cloudinary** | Object storage adapters |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **TypeScript 5** | Language |
| **Tailwind CSS 3** | Styling |
| **TanStack Query** | Server state / data fetching |
| **React Router 6** | Routing |
| **React Hook Form** | Form validation |
| **Axios** | HTTP client with JWT refresh interceptor |
| **Framer Motion** | Animations |
| **Recharts** | Charts & data visualization |
| **Radix UI** | Accessible primitives |
| **Lucide React** | Icons |

---

## Architecture

FlowLens uses a **REST API + SPA** architecture with a clear separation of concerns:

```
┌─────────────────────┐        ┌──────────────────────┐
│   React Frontend     │  HTTP  │    NestJS Backend     │
│   (Vite + Tailwind)  │ ─────► │   /api/v1 endpoints   │
└─────────────────────┘        └──────────────────────┘
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                     ┌─────────┐  ┌─────────┐  ┌──────────────┐
                     │Prisma/  │  │  Redis  │  │  BullMQ Jobs  │
                     │PostgreSQL│  │ (cache) │  │ (async work) │
                     └─────────┘  └─────────┘  └──────┬───────┘
                                                      │
                                        ┌─────────────┼─────────────┐
                                        ▼             ▼             ▼
                                   AI Analysis   Report Gen.   Attachments
                                   (Provider:                    (S3/Cloudinary)
                                    OpenAI/Gemini/Groq)
```

### Key design decisions

- **Modular NestJS** — each feature (auth, users, orgs, logs, reports, notifications) is a self-contained module with its own controller, service, and DTOs.
- **Prisma + PostgreSQL** — a rich schema with real relational integrity: users, orgs, memberships, logs, categories, tags, attachments, AI reports, notifications, and audit trails.
- **Redis as cache + queue broker** — `cache-manager` for fast reads (dashboard aggregates, tag suggestions) and BullMQ for all async work.
- **Provider abstraction** for AI — `AiProvider` interface with OpenAI, Gemini, and Groq implementations; swap providers via a single `.env` variable.
- **JWT with refresh-token rotation** — access tokens (short-lived) + rotating, revocable refresh tokens (long-lived) for secure session management.
- **Soft deletion** — logs use `deletedAt` and categories use `isActive` so historical AI analyses and reports remain valid.

---

## AI Processing Flow

AI analysis is **fully asynchronous** and never blocks the request path:

1. **User creates a frustration log** → the API immediately responds with a deterministic preliminary Friction Score (computed from the user's self-rating, recent same-category frequency, and neutral preventability).
2. **A BullMQ job is enqueued** on the `ai-analysis` queue.
3. **A background worker picks up the job** and calls the configured AI provider (OpenAI / Gemini / Groq) to:
   - Suggest a category and tags
   - Score severity and preventability (0–100)
   - Generate a sentiment summary
   - Create a pgvector embedding for semantic search
4. **The worker updates the log** with AI-derived scores (overwriting the preliminary values), attaches AI-suggested tags, and optionally notifies the user if friction score ≥ 75.
5. **Report generation** follows the same pattern via a separate queue — reports are generated off-thread and their status is tracked (`PENDING → PROCESSING → COMPLETED/FAILED`).

The frontend polls detail pages while a log/report is still processing — a pragmatic equivalent to websockets until a realtime layer is added.

---

## Project Structure

```
flowlens-backend-fixed final/
├── prisma/
│   ├── schema.prisma              # Database schema (24 models)
│   └── migrations/                # Prisma migration files
├── src/
│   ├── main.ts                    # Bootstrap: CORS, helmet, validation, Swagger
│   ├── app.module.ts              # Root module: global guards/filters/interceptors
│   ├── common/                    # Shared guards, decorators, filters, interceptors
│   │   ├── guards/                #   JwtAuth, Roles, OrgRoles, RefreshToken
│   │   ├── decorators/            #   @Public, @Roles, @OrgRoles, @CurrentUser…
│   │   ├── filters/               #   Global HTTP exception filter
│   │   └── interceptors/          #   Logging + response transform
│   ├── config/                    # Environment configuration + validation
│   ├── modules/
│   │   ├── auth/                  # Register, login, refresh, verify, reset
│   │   ├── users/                 # User CRUD, admin role management
│   │   ├── organizations/         # Org CRUD, membership
│   │   ├── teams/                 # Invites, member role updates
│   │   ├── frustration-logs/      # Core: log CRUD, filters, attachments
│   │   ├── categories/            # User/org scoped categories
│   │   ├── reports/               # AI report generation & retrieval
│   │   ├── notifications/         # In-app + email notifications
│   │   ├── ai/                    # AI provider abstraction (OpenAI/Gemini/Groq)
│   │   ├── jobs/                  # BullMQ queues + processors
│   │   ├── email/                 # SMTP email service
│   │   └── health/                # Health check endpoint
│   ├── cache/                     # Redis cache helper
│   ├── storage/                   # S3 + Cloudinary adapters
│   └── prisma/                    # Prisma service (DI wrapper)
├── flowlens-frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── api/                   # Per-module API client functions
│   │   ├── components/            # UI components (buttons, cards, layout…)
│   │   ├── pages/                 # Route pages (dashboard, logs, reports…)
│   │   ├── context/               # Auth + theme contexts
│   │   ├── lib/                   # API client, utils, motion helpers
│   │   └── types/                 # Shared TypeScript types
│   ├── index.html
│   └── vite.config.ts             # Dev proxy to backend on :4000
├── .env.example                   # Environment variable template
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20**
- **PostgreSQL 15+** with the **pgvector** extension available
- **Redis** (for cache + BullMQ)
- An **AI provider API key** (OpenAI, Gemini, or Groq)

### 1. Clone & install

```bash
git clone https://github.com/Hamnatech/flowlens.git
cd flowlens
npm install
cd flowlens-frontend
npm install
cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
JWT_ACCESS_SECRET=your_32_plus_char_secret
JWT_REFRESH_SECRET=your_32_plus_char_secret
DATABASE_URL=postgresql://user:password@localhost:5432/flowlens?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=sk-...        # or GEMINI_API_KEY / GROQ_API_KEY
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the backend

```bash
npm run start:dev
```

The API starts on **port 4000** (default). Verify:

```bash
curl http://localhost:4000/health
```

Swagger UI is available at **http://localhost:4000/docs**.

### 5. Run the frontend

In a second terminal:

```bash
cd flowlens-frontend
cp .env.example .env      # optional — defaults to /api/v1 via Vite proxy
npm run dev
```

The SPA runs on **port 3000** (default) and proxies `/api/*` to the backend on port 4000 — no CORS changes needed.

---

## Environment Variables

Environment variables live in `.env` (git-ignored). The template is in **`.env.example`** — it contains **no real secrets**, only placeholders and safe development defaults.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` / `production` / `test` |
| `PORT` | No | API port (default `4000`) |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Yes | Redis connection for cache + BullMQ |
| `JWT_ACCESS_SECRET` | **Yes** | Access-token signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh-token signing secret (32+ chars) |
| `OPENAI_API_KEY` | Yes* | OpenAI key (*or Gemini/Groq — pick one AI provider) |
| `AI_PROVIDER` | No | `openai` / `gemini` / `groq` (default `openai`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default `http://localhost:3000`) |
| `STORAGE_PROVIDER` | No | `s3` or `cloudinary` |
| `S3_*` / `CLOUDINARY_*` | No | Storage credentials (only if using file uploads) |
| `SMTP_*` | No | Email transport (verification, password reset) |
| `STRIPE_*` | No | Billing (schema ready, not yet implemented) |

---

## API / Swagger

The backend exposes a **versioned REST API** at `/api/v1` with interactive documentation at:

> **`/docs`** — Swagger UI (OpenAPI 3)

All endpoints (except `auth/*` and `health`) require a `Bearer` access token obtained from `/api/v1/auth/login`.

**Core endpoint groups:**

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/forgot-password` · `POST /auth/reset-password` |
| Users | `GET/PATCH /users/me` · `GET /users` · `PATCH /users/:id/role` |
| Organizations | `POST /organizations` · `GET/PATCH /organizations/:id` · memberships |
| Teams | `POST /organizations/:id/invites` · `PATCH /invites/:token/accept` · role updates |
| Frustration Logs | `GET/POST /frustration-logs` · `GET/PATCH/DELETE /frustration-logs/:id` · org-scoped variants |
| Categories | `GET/POST /categories` · `PATCH /categories/:id` |
| Reports | `GET/POST /reports` · `GET /reports/:id` |
| Notifications | `GET /notifications` · `PATCH /notifications/:id/read` |
| Health | `GET /health` |

---

## Current Implementation Status

### ✅ Implemented

- Full auth flow (register, login, refresh rotation, logout, email verification, password reset/change)
- Session management (list/revoke sessions, revoke-all)
- Two-tier RBAC (platform roles + org roles)
- Organizations, teams, invites, member role management
- Frustration log CRUD with rich filtering, pagination, soft-delete, tags, categories
- AI analysis pipeline (category suggestion, severity/preventability scoring, auto-tagging, embeddings)
- Friction score computation (preliminary + AI-refined)
- AI report generation (daily/weekly/monthly) with recommendations & burnout risk
- Notifications (in-app; email dispatch stubbed to provider boundary)
- Storage adapters (S3 + Cloudinary) for uploads
- Background jobs via BullMQ (4 queues)
- Redis caching (dashboard, tag suggestions, login lockout)
- Global guards: rate limiting → JWT auth → roles → org roles
- Global exception filter + response transform interceptor
- Request-ID middleware, Pino structured logging
- Swagger/OpenAPI documentation
- Health check endpoint
- Full React SPA (login/register, dashboard, logs, reports, categories, orgs, notifications, settings, marketing pages)

### ⏳ Partially implemented / schema-ready only

| Feature | Status |
|---------|--------|
| **Email delivery** | Service exists (verification/reset/notification emails wired) — SMTP transport configured but not tested against a live provider |
| **Attachment upload UI** | Backend endpoints + storage adapters exist; frontend upload UI not yet wired |
| **Email verification UI** | Backend flow complete; frontend page not wired |
| **Password-reset UI** | Backend flow complete; frontend page not wired |
| **Dark mode toggle** | CSS variables support `.dark` class; no UI switch yet |
| **Dashboard aggregates** | Dashboard computes real stats from paginated data — no dedicated aggregate endpoint yet |
| **Realtime updates** | Uses polling while jobs process; no websocket layer yet |

### ❌ Not yet implemented

- **Analytics/Dashboard aggregates** endpoint (schema supports it; service/controller not built)
- **Stripe billing** (schema supports plans/subscriptions/invoices; no Stripe integration logic)
- **Community Insights** (schema supports opt-in anonymized sharing; no service/controller)
- **Third-party integrations** (schema supports Slack/Teams/Google Calendar/Gmail/Notion/GitHub; no integration logic)

---

## Security

FlowLens implements defense-in-depth across the stack:

| Layer | Implementation |
|-------|---------------|
| **Password storage** | Argon2id with configurable memory/time cost (OWASP-recommended) |
| **Access tokens** | Short-lived JWTs (15m default) with explicit secrets per token type |
| **Refresh tokens** | Rotated on every use; stored hashed (SHA-256); single-use with reuse detection → revokes all sessions on replay |
| **Session management** | List, revoke single, or revoke-all sessions; logout everywhere |
| **Login lockout** | 5 failed attempts → 15-minute lockout (Redis-backed, per-email + IP metadata) |
| **RBAC** | Two-tier: `PlatformRole` (USER/ADMIN) × `OrgRole` (OWNER/ADMIN/MEMBER), enforced by global guards |
| **Validation** | Class-validator DTOs with `whitelist: true` + `forbidNonWhitelisted` (strict payloads) |
| **Rate limiting** | Global ThrottlerGuard (100 req / 60s default) |
| **Security headers** | Helmet (CSP off for JSON API, HSTS + frame/content-type protections on) |
| **Environment secrets** | All secrets loaded via `.env`, git-ignored; only `.env.example` with placeholders is committed |
| **CORS** | Explicit allow-list from env — permissive only in development |
| **Soft deletion** | Logs use `deletedAt`; categories use `isActive` — no destructive hard-deletes where historical data depends on them |
| **Account enumeration** | Uniform responses for forgot-password / login failures; NotFound (not Forbidden) for cross-user log access |
| **Audit trail** | `ActivityLog` records logins, role changes, invites, and other sensitive actions (immutable, insert-only) |

---

## Roadmap

Planned next steps — in priority order:

1. **Dedicated dashboard/analytics aggregate endpoint** — server-side aggregation for time-series and category stats
2. **Stripe billing integration** — plans, subscriptions, invoices, webhooks (schema already modeled)
3. **Attachment upload UI** — wire the existing backend upload endpoint + storage adapters into the log detail page
4. **Email verification + password-reset UIs** — connect the existing backend flows to frontend pages
5. **Community Insights** — opt-in anonymized aggregate sharing and category-level benchmark stats
6. **Realtime updates** — websocket layer (Socket.io or SSE) to replace polling
7. **Dark mode toggle UI** — expose the existing CSS-variable theming
8. **Third-party integrations** — Slack, Google Calendar, Gmail, Notion, GitHub (schema already modeled)

---

## Author / Portfolio

**Hamna Shafique** — CS '28 · Full-stack developer · Debugger by necessity

This project was built to demonstrate end-to-end full-stack engineering: modular backend architecture, AI integration, background job processing, real-time-friendly frontend patterns, and production-minded security.

[![GitHub](https://img.shields.io/badge/GitHub-HamnaTech-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/HamnaTech) · [![Portfolio](https://img.shields.io/badge/Portfolio-hamna.tech-0077B5?style=flat-square&logo=internet&logoColor=white)](https://hamna.tech)

---

## License

This project is for portfolio demonstration purposes. Contact the author for licensing inquiries.