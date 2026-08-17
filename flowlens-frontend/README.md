# FlowLens AI — Frontend

React + TypeScript + Tailwind SPA connected to the FlowLens backend API.

## Status

Built and statically verified (every import resolves, every dependency is
declared, every routed page's export matches its import) — **not yet
compiled or run**, because this environment has no network access to
`npm install`. Treat your first `npm install && npm run build` as the real
first compile, same caveat as the backend.

## Setup

```bash
cp .env.example .env
# Edit VITE_API_BASE_URL if your backend isn't on the default
# http://localhost:4000/api/v1

npm install
npm run dev
```

Runs on **port 3000** by default (matches `CORS_ORIGINS=http://localhost:3000`
already in the backend's `.env.example` — no backend config change needed).

Make sure the backend is running first (`npm run start:dev` in the backend
project) — this app has no offline/mock mode; every page hits a real endpoint.

## Architecture

- **Vite + React SPA**, not Next.js — a pure JWT-token client doesn't need
  server rendering or cookie handling, so a plain SPA has fewer moving parts.
- **One Axios instance** (`src/lib/api-client.ts`) owns JWT attachment and
  401-triggered token refresh. No component ever touches `fetch`/`axios`
  directly — they go through `src/api/*.api.ts`, one file per backend module,
  each function mapping 1:1 to a verified real route.
- **TanStack Query** for all server state (loading/error/caching), **React
  Hook Form** for all forms, **React Router** for routing.
- Response envelope handling (`{ success, data, meta?, timestamp }`) is
  unwrapped once in `api-client.ts` via `unwrap()`/`unwrapPaginated()` —
  page components only ever see the actual data shape.
- Async AI work (log analysis, report generation) is reflected via short
  polling (`refetchInterval`) on the detail pages while status is
  pending/processing — the backend has no websocket layer yet, so this is
  the pragmatic equivalent.
- No dashboard/analytics aggregate endpoint exists on the backend yet — the
  Dashboard page computes stats from real paginated data (recent logs,
  category counts) rather than fabricating numbers. See the comment in
  `src/pages/dashboard/use-dashboard-data.ts`.

## Pages

Login · Register · Dashboard · Frustration Logs (list/create/detail+edit) ·
Categories · AI Reports (list/detail) · Organizations · Team Members ·
Notifications · Settings

## What's intentionally not built yet

- No `Register` → `verify email` flow UI (backend supports it; not wired to a page)
- No password-reset flow UI (backend supports it; not wired to a page)
- No attachment upload UI on the log detail page (backend endpoint exists; not wired)
- No dark mode toggle (CSS variables support it — `.dark` class is defined — just no UI switch yet)
