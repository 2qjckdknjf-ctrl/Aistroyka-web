# Web Technical Dossier — Aistroyka (apps/web)

**Version:** 1.0  
**Scope:** apps/web (Next.js). Product logic unchanged; analysis and recommendations only.

---

## Overview

- **Location:** `apps/web`
- **Role:** Main web app for Aistroyka AI Construction Intelligence Platform (auth, projects, media, AI analysis, admin/trust/governance, team, billing, portfolio).
- **Deployment:** Next.js on Cloudflare (OpenNext + Wrangler). Optional Vercel-style deploy.
- **Architecture style:** Next.js App Router with locale-first routing; feature-oriented folders under `(dashboard)`; shared `lib/` and `components/ui`; no formal domain modules.

---

## Stack

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Framework | Next.js | 14.2.18 |
| React | react, react-dom | 18.3.1 |
| State | React state + server components | No Redux/Zustand; server data + client islands |
| UI | Tailwind CSS, design tokens (design-tokens.css) | Custom components in components/ui, ui-lite |
| API layer | fetch() to Next.js API routes | No axios/trpc/graphql; Supabase client for DB |
| Auth | Supabase Auth (@supabase/ssr) | Cookie-based session in middleware (updateSession) |
| Routing | App Router | [locale] → (auth), (dashboard); i18n via next-intl |
| i18n | next-intl | 4.8.3; locales: ru, en, es, it; messages in messages/*.json |
| Testing | Vitest | 4.0.18; node env; **/*.test.ts |
| Lint | ESLint | eslint-config-next 14.2.18 |
| Build | next build | OpenNext for Cloudflare |

---

## Directory Map

```
apps/web/
├── app/
│   ├── [locale]/                    # Locale segment
│   │   ├── layout.tsx               # NextIntlClientProvider, setRequestLocale
│   │   ├── page.tsx                 # Root redirect/landing
│   │   ├── (auth)/login, register/
│   │   ├── (dashboard)/              # Protected dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/, projects/, admin/, team/, portfolio/, billing/
│   │   │   └── projects/[id]/page.tsx  # Heavy project detail (416 lines)
│   │   ├── invite/accept/
│   │   └── smoke/
│   ├── api/                          # API routes (see list_routes / api_endpoints_map)
│   ├── layout.tsx, error.tsx, not-found.tsx
│   ├── globals.css, design-tokens.css
├── components/
│   ├── ui/                           # Button, Card, Input, Modal, Alert, Badge, etc.
│   ├── ui-lite/                      # Collapsible
│   ├── Nav.tsx, NavLogout.tsx, AppLayout.tsx
├── lib/
│   ├── supabase/                     # client, server, middleware, admin, rpc
│   ├── supabase-server.ts, supabase-browser.ts
│   ├── api/                          # engine, rpcClient, errorShape, validateAnalysisResult, rpcCatalog
│   ├── intelligence/                 # evidence, governance, calibration, portfolio, etc.
│   ├── ai/                           # runOneJob, types, stages, normalize, prompts, riskCalibration
│   ├── auth/, env.ts, app-url.ts, types.ts, storage.ts, rpc.ts
│   ├── observability/metrics.ts
│   ├── jobStateMachine.ts, triggerLock.ts, pollingBackoff.ts
├── i18n/                             # routing, request, navigation
├── messages/                         # ru.json, en.json, es.json, it.json
├── middleware.ts                     # intl + updateSession + security headers
├── scripts/                          # migrations, health-check, cf-*, supabase-*
├── next.config.js, tsconfig.json, tailwind.config.ts, vitest.config.ts
└── .env.example, .env.local.example, .env.production.example, .env.staging.example
```

- **Pages/routes:** Under `app/[locale]/` and `app/api/` (see list_routes).
- **Components:** `components/ui`, `components/ui-lite`; page-specific components next to pages (e.g. projects/*.tsx).
- **Business logic:** `lib/intelligence/*`, `lib/ai/*`, `lib/api/*`; RPC and engine in `lib/supabase/rpc.ts`, `lib/api/engine.ts`.
- **API client:** No dedicated client; `fetch()` to `/api/*` from client components; server uses Supabase client and `getAdminClient()` where needed.
- **Types/models:** `lib/types.ts`, `lib/ai/types.ts`; inline types in API and components.
- **Utils:** `lib/env.ts`, `lib/app-url.ts`, `lib/jobStateMachine.ts`, etc.
- **Styles:** `app/globals.css`, `app/design-tokens.css`; Tailwind + CSS variables (--aistroyka-*).

---

## Build Health

| Check | Result | Notes |
|-------|--------|-------|
| **lint** | Pass | `next lint` — no warnings/errors. |
| **typecheck** | Fail (test files only) | `tsc --noEmit`: 9 errors in `app/api/analysis/process/route.test.ts` and `app/api/health/route.test.ts` — `vi.stubEnv("KEY", value)` "Expected 0 arguments, but got 1". Vitest 4 supports two-arg stubEnv; types may be wrong or tsconfig excludes tests. |
| **tests** | Pass | `vitest run` — 8 files, 57 tests. |
| **build** | Pass | `next build` — compiles, type-checks (Next uses its own typecheck and may exclude *.test.ts). |

**Toolchain:**

- **ESLint:** Only `extends: "next/core-web-vitals"` (`.eslintrc.json`). No custom rules or Prettier config in repo.
- **TSConfig:** `strict: true`, `paths: { "@/*": ["./*"] }`, `skipLibCheck: true`. No `noUncheckedIndexedAccess`.
- **Env validation:** `lib/env.ts` validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (getPublicEnv); throws if missing. Other env (OPENAI_API_KEY, AI_ANALYSIS_URL, etc.) read ad hoc in API routes.
- **Dead code / unused exports:** Not run; recommend `ts-prune` or ESLint no-unused-exports as P1.

**Risks:**

- P0: CI typecheck may fail if it runs `tsc --noEmit` including test files.
- P1: No Prettier; formatting may drift.
- P1: No centralized env schema for server-only vars.

---

## Security

- **Token storage:** Supabase Auth with @supabase/ssr; session in **cookies** (getAll/setAll in `lib/supabase/middleware.ts`). No localStorage for auth tokens in app code.
- **XSS:** No `dangerouslySetInnerHTML` or `__html` in app code (grep). User content rendered as text.
- **CSRF:** Same-origin API routes; session via cookies. Next.js App Router does not use classic form CSRF tokens; reliance on SameSite cookies and origin checks. No explicit CSRF token on POST.
- **CORS:** Not applicable for same-origin; API routes are same-site. No custom CORS in next.config.
- **Secrets in client bundle:** Only `NEXT_PUBLIC_*` are exposed. Used: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `lib/env.ts`, client, middleware). `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabase/admin.ts` (server-only, `process.env`). No service role key in client.
- **Open API keys:** `.env.example` documents placeholders; no real keys in repo. Health and analyze routes use `process.env.OPENAI_API_KEY` server-side only.

**Risks:**

- P2: Document that SUPABASE_SERVICE_ROLE_KEY must never be in client or NEXT_PUBLIC_*.
- P2: Consider CSP tightening (e.g. reduce 'unsafe-inline' for script if possible) — see middleware SECURITY_HEADERS.

---

## Performance

- **Heavy pages:** `app/[locale]/(dashboard)/projects/[id]/page.tsx` (416 lines) — single server component doing many sequential Supabase queries (project, media, jobs, analyses) and heavy intelligence work (evidence, projection, governance, strategic risk, time-weighted, health score, simulation, etc.). No parallelization of independent queries; no caching layer.
- **Rerenders:** Client components (e.g. MediaAnalysisRow, JobListPolling, TriggerAnalysisButton) use local state; no global store. Polling (JobListPolling) triggers full refetches via router refresh or refetch.
- **Bundles:** Next build shows First Load JS per route (e.g. project [id] 123 kB). No bundle analyzer run; no explicit code-splitting beyond Next automatic.
- **Code splitting:** No `next/dynamic` or `React.lazy` usage. Heavy admin/trust/governance and project subcomponents load with the route.
- **Data fetching:** Server components fetch in tree; client uses `fetch("/api/...")` and polling. No SWR/React Query — no client-side cache or dedup.
- **Images:** No `next/image` or `<img>` for media previews; `MediaAnalysisRow` shows `file_url` as text only. If previews are added, use next/image and proper sizing.

**Quick wins:**

- Parallelize independent Supabase queries on project [id] page (e.g. Promise.all for media + jobs + analyses where possible).
- Dynamic import for heavy admin subpages (governance, trust) or heavy blocks (DecisionSimulation, runSimulation).
- Add `next/image` for any future media thumbnails; ensure storage URLs are in image domains in next.config if needed.
- Consider React.memo for list items (MediaAnalysisRow) if list grows.

---

## API / Data Flow

- **How web talks to backend:** (1) Browser → Next.js API routes (`/api/*`). (2) API routes use Supabase client (server) or getAdminClient() for storage/admin. (3) AI: `/api/ai/analyze-image` (OpenAI) and optional `AI_ANALYSIS_URL` for external analyze; `/api/analysis/process` triggers processing and uses runOneJob (fetch to AI_ANALYSIS_URL or in-app analyze-image).
- **Endpoints used by client:** See `api_endpoints_map.md`. Summary: `/api/health`, `/api/projects`, `/api/projects/[id]/upload`, `/api/projects/[id]/poll-status`, `/api/analysis/process`, `/api/tenant/invite`, `/api/tenant/revoke`, `/api/tenant/accept-invite`; trigger routes for jobs/media.
- **Auth:** Cookie session via middleware; API routes that need user call `createClient()` (server) and `getUser()`. No explicit Authorization header from client to Next API (same-origin cookies).
- **Error handling:** No single error shape for all API responses. Some routes return JSON `{ error: string }`; client checks `res.ok` and parses body. `lib/api/errorShape.ts` exists but not used everywhere.
- **Retry/backoff:** `lib/ai/runOneJob.ts` has retry on 5xx and timeout; polling in JobListPolling. No generic fetch retry wrapper.
- **Abort:** runOneJob uses AbortController with timeout; not all client fetch() calls use AbortController.
- **Typing:** API responses not fully normalized to shared types; some any or ad hoc shapes.

**Risks:**

- P1: Unify API error shape and use errorShape (or equivalent) on all routes.
- P1: Add request_id or correlation id for tracing (optional).
- P2: Client fetch wrapper with retry/abort/timeout for critical paths.

---

## UI Consistency

- **Design system:** `app/design-tokens.css` and `lib/ui-tokens.ts`; Tailwind with var(--aistroyka-*). Components in `components/ui` (Button, Card, Input, Modal, Alert, Badge, SectionHeader, etc.) use tokens.
- **Duplication:** Some form patterns repeated (e.g. CreateProjectForm, UploadMediaForm, invite flow) without a shared form hook or validation layer. No shared validation schema (Zod/Yup) across forms.
- **Empty/error states:** `components/ui/EmptyState.tsx`, `ErrorState.tsx` exist; usage may be inconsistent across pages. Modal and toasts: Modal exists; no dedicated toast system in repo.
- **Recommendation:** Standardize on a small set: form (optional shared useForm + schema), modal, toast (add if needed), empty/error states in every list/detail view.

---

## Testing

- **Unit/component:** Vitest; tests in `lib/ai/*.test.ts`, `app/api/health/route.test.ts`, `app/api/analysis/process/route.test.ts`, `app/api/ai/analyze-image/route.test.ts`. No React component tests (no Testing Library in package.json).
- **Integration:** API route tests act as integration (call GET/POST handlers with Request). No separate integration suite.
- **E2E:** No Playwright/Cypress. No e2e folder or config.

**Suggested minimal e2e smoke (P1):**

1. Open app → redirect to locale/login if unauthenticated.
2. Login (or register) → land on dashboard.
3. Open project list → open one project (key AI scenario).
4. Upload image (or use existing media) → trigger analysis → poll until completion or error.
5. One test for error path (e.g. 401 or 5xx handling).

---

## Risks (Summary)

| Priority | Item | Location / action |
|----------|------|-------------------|
| P0 | TypeScript errors in test files (vi.stubEnv) | app/api/*/route.test.ts; fix types or exclude tests from tsc |
| P0 | CI: ensure typecheck passes (align with next build or tsc exclusions) | CI workflow |
| P1 | No Prettier / format drift | Add Prettier + format check in CI |
| P1 | Single 416-line server component; sequential queries | app/[locale]/(dashboard)/projects/[id]/page.tsx; parallelize and/or split |
| P1 | No unified API error shape | lib/api/errorShape.ts; adopt in all API routes |
| P1 | No e2e smoke | Add Playwright (or Cypress) + smoke scenarios |
| P2 | No client-side cache (SWR/React Query) | Optional for list/detail refetch |
| P2 | No next/image for media | When adding previews, use next/image |
| P2 | CSP still has unsafe-inline | middleware.ts; harden when possible |
