# System Repository Map

**Generated:** Full system state analysis — CTO/Principal Architect mode.  
**Scope:** AISTROYKA.AI monorepo (Next.js 14, OpenNext/Cloudflare, Supabase).

---

## 1. Complete Directory Structure

```
AISTROYKA/
├── app/                          # Legacy/duplicate app dir (some routes duplicated from apps/web)
│   ├── api/
│   │   ├── auth/diag/
│   │   ├── health/
│   │   ├── projects/.../jobs/.../trigger, upload
│   └── (auth)|(dashboard)|smoke
├── apps/
│   └── web/                      # Primary Next.js 14 app (OpenNext + Cloudflare)
│       ├── app/
│       │   ├── [locale]/
│       │   │   ├── (auth)/        # login, register
│       │   │   ├── (dashboard)/   # dashboard, projects, admin, billing, portfolio, team
│       │   │   ├── invite/accept/
│       │   │   ├── smoke/
│       │   │   └── layout, page
│       │   ├── api/               # Route handlers (see API endpoints below)
│       │   ├── dashboard/         # Legacy redirect target
│       │   ├── error, layout, not-found, page
│       │   └── ...
│       ├── components/
│       ├── lib/                   # Core application and platform code
│       ├── middleware.ts
│       ├── supabase/migrations/  # 35+ SQL migrations
│       ├── tests/e2e/
│       ├── wrangler.toml
│       └── package.json
├── packages/
│   ├── api-client/               # HTTP client + types for API consumers
│   ├── contracts/                # Shared schemas (Zod), API types
│   └── contracts-openapi/        # OpenAPI build from contracts
├── engine/                       # Separate Aistroyk engine (migrations, dist)
│   └── Aistroyk/
│       ├── dist/
│       └── supabase/migrations/
├── docs/                         # ADRs, API docs, runbooks, reports
│   ├── ADR/
│   ├── audit/, compliance/, operations/, runbooks/, security/, status/
│   └── *.md
├── TestLogs/                     # iOS/test derived data (no source)
├── audit_* / audit_*_artifacts/  # Audit/backup folders (not main app)
├── exports/                      # Phase4 enterprise exports
└── package.json                  # Root: delegates to apps/web
```

---

## 2. Module Responsibilities

| Path | Responsibility |
|------|----------------|
| **apps/web/app/api/** | Next.js Route Handlers. Mix of legacy (`/api/health`, `/api/ai/...`) and versioned `/api/v1/*`. |
| **apps/web/lib/tenant/** | Tenant context from request (auth + tenant_members), requireTenant, authorize, client profile (x-client). |
| **apps/web/lib/auth/** | Admin check, tenant helpers. |
| **apps/web/lib/authz/** | RBAC: permissions, scopes, policy (authz.service, authz.repository). |
| **apps/web/lib/supabase/** | createClient (server, cookies), getAdminClient (service role), middleware (updateSession), RPC. |
| **apps/web/lib/domain/** | Domain services + repositories: projects, media, reports, tasks, upload-session, worker-day, org, tenants, project-members, task-assignments. |
| **apps/web/lib/platform/** | Platform capabilities: jobs (queue, handlers), ai (providers, circuit-breaker), ai-usage, ai-governance, billing, flags, idempotency, rate-limit, push, analytics, anomaly, privacy, exports, identity, routing. |
| **apps/web/lib/sync/** | Sync engine: change_log, cursors, change-log.service/repository. |
| **apps/web/lib/sre/** | SLO, alerts, error budgets. |
| **apps/web/lib/observability/** | Logger, metrics, audit. |
| **apps/web/lib/ai/** | Vision: prompts, normalize, riskCalibration, runVisionAnalysis, runOneJob (no single AIService facade used by all routes). |
| **apps/web/lib/intelligence/** | Dashboard/construction intelligence: governance, calibration, evidence, portfolio, projection, strategicRisk, healthScore, actionItems, simulation. |
| **apps/web/lib/config/** | Server/public config, feature flags, debug. |
| **apps/web/lib/controllers/** | Health controller (used by health routes). |
| **packages/contracts/** | Zod schemas and API types (health, projects, ai, config, sync, tenant, subscription). |
| **packages/contracts-openapi/** | build-openapi.ts → dist/openapi.json. |
| **packages/api-client/** | Typed client for API (fetcher, types). |

---

## 3. API Endpoints (apps/web)

- **Legacy (no version):** `/api/health`, `/api/health/auth`, `/api/auth/login`, `/api/_debug/auth`, `/api/diag/supabase`, `/api/ai/analyze-image`, `/api/analysis/process`, `/api/projects`, `/api/projects/[id]`, `/api/projects/[id]/upload`, `/api/projects/[id]/jobs/[jobId]/trigger`, `/api/projects/[id]/media/[mediaId]/trigger`, `/api/projects/[id]/poll-status`, `/api/tenant/*` (invite, members, invitations, accept-invite, revoke).
- **v1:** `/api/v1/health`, `/api/v1/config`, `/api/v1/projects`, `/api/v1/ai/analyze-image` (re-exports `/api/ai/analyze-image`), `/api/v1/jobs/process`, `/api/v1/sync/bootstrap`, `/api/v1/sync/changes`, `/api/v1/sync/ack`, `/api/v1/media/upload-sessions`, `/api/v1/media/upload-sessions/[id]/finalize`, `/api/v1/media/[mediaId]/annotations|comments|collab`, `/api/v1/reports/[id]/analysis-status`, `/api/v1/worker`, `/api/v1/worker/tasks/today`, `/api/v1/worker/day/start|end`, `/api/v1/worker/report/create|add-media|submit`, `/api/v1/worker/sync`, `/api/v1/devices/register|unregister`, `/api/v1/billing/*`, `/api/v1/org/*`, `/api/v1/admin/*` (many: ai/usage, alerts, analytics, audit-logs, exports, flags, jobs, metrics, anomalies, privacy, push, security, slo, tenants), `/api/v1/scim/[...path]`.

---

## 4. Dependency Relationships (High Level)

- **Routes** → lib/tenant (context), lib/supabase (server/admin), domain services or platform services; some routes call Supabase directly (e.g. sync/bootstrap partial).
- **Domain services** → repositories, tenant context; some use platform (e.g. jobs).
- **Platform/jobs** → job.handlers (ai-analyze-media, ai-analyze-report, export, retention-cleanup, resolve-image-url), queue.db, ai-usage, provider.router (vision); runVisionAnalysis in lib/ai calls OpenAI directly (not always via provider.router).
- **Auth** → Supabase Auth (cookies via @supabase/ssr), tenant_members, tenants; middleware runs updateSession then intl + protected path redirect.
- **Contracts** → consumed by apps/web and api-client; OpenAPI built from contracts.

---

## 5. Build and Entry Points

- **Root:** `npm run dev|build|cf:build|cf:deploy` → delegates to `apps/web`.
- **apps/web:** `next build`, `opennextjs-cloudflare build` → `.open-next/`; `wrangler deploy` uses `main = ".open-next/worker.js"`.
- **Cron/workers:** No standalone Worker scripts in repo; job processing is HTTP-triggered via `/api/v1/jobs/process`.

---

## 6. Tests

- **Unit:** Vitest; tests under `apps/web/lib/**/*.test.ts`, `apps/web/app/api/**/*.test.ts`.
- **E2E:** Playwright `apps/web/tests/e2e/ai-smoke.spec.ts` (and copies in audit artifacts).
- **Config:** vitest.config.ts, playwright in apps/web.

---

## 7. Notable Gaps in Map

- **app/** at repo root: Contains routes that duplicate or predate apps/web; relationship to apps/web is unclear (possible legacy or mistaken structure).
- **engine/Aistroyk:** Separate app with its own Supabase migrations; not wired into main apps/web build or deployment.
- **Lite client restriction:** x-client is parsed in tenant context; no single middleware or route layer that enforces “Lite may only call /api/v1/worker/*, sync/*, …” by path.
- **Construction brain / vision:** Referenced in architecture guardrails under `apps/web/lib/ai/construction-brain/` and `lib/ai/vision/`; current codebase has `lib/ai/` (vision, prompts, runVisionAnalysis) and `lib/intelligence/` (dashboard logic), not a single “construction-brain” or “vision” module tree.
