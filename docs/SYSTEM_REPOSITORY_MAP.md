# System Repository Map

**Generated:** Full system state analysis — CTO/Principal Architect mode.  
**Scope:** **Aistroyka** monorepo (Next.js, OpenNext/Cloudflare, Supabase). Canonical naming: `docs/architecture/CORE_B4_CANONICAL_NAMING.md`. Root `package.json` name `AISTROYKA-WEB-CF-CHECK` is an internal npm workspace id, not the product name.

---

## 1. Directory structure (current)

```
AISTROYKA/                        # Repo root (folder name; product in prose: Aistroyka)
├── AGENTS.md, README.md, package.json
├── android/                      # AiStroykaManager, AiStroykaWorker + shared
├── apps/web/                     # Primary Next.js app (OpenNext + Cloudflare)
│   ├── app/                      # App Router: [locale], api/, middleware
│   ├── components/, lib/, public/, tests/e2e/
│   ├── supabase/migrations/
│   └── wrangler.toml, package.json
├── archive/, artifacts/, audit_*/, docs/, exports/, logs/, reports/, scripts/
├── ios/                          # AiStroykaManager, AiStroykaWorker, Shared, Config
├── lib/                          # Legacy root TS (duplicate of older patterns; see B3 — primary app lib is apps/web/lib)
├── packages/
│   ├── api-client/               # Optional TS SDK (external); not apps/web runtime
│   ├── contracts/
│   └── contracts-openapi/
├── shared/                       # Cross-cutting shared assets / contracts pointers
├── components/, public/          # Root-level legacy Next artifacts (if present)
└── middleware.ts, next.config.js, tailwind.config.ts, tsconfig.json  # Root legacy; primary app config under apps/web
```

*Note:* Exact root-level `components/`, `public/` may exist for historical tooling; **authoritative web app** is under **`apps/web`**.

---

## 2. Module responsibilities

| Path | Responsibility |
|------|----------------|
| **apps/web/app/api/** | Route handlers. Legacy `/api/*` and versioned `/api/v1/*`. |
| **apps/web/lib/tenant/** | Tenant context, requireTenant, authorize, x-client profile. |
| **apps/web/lib/auth/** | Admin check, tenant helpers. |
| **apps/web/lib/authz/** | RBAC, permissions, policy. |
| **apps/web/lib/supabase/** | Server/admin clients, middleware session, RPC. |
| **apps/web/lib/domain/** | Domain services + repositories (projects, media, reports, tasks, worker-day, etc.). |
| **apps/web/lib/platform/** | Jobs, AI providers, billing, flags, push, analytics, etc. |
| **apps/web/lib/sync/** | Sync engine, change_log, cursors. |
| **packages/contracts/** | Zod schemas and API types. |
| **packages/contracts-openapi/** | build-openapi.ts → dist/openapi.json. |
| **packages/api-client/** | Optional TS SDK for API consumers; not part of web app build graph. See `CORE_B4_PACKAGE_NAMING_ALIGNMENT.md`. |

---

## 3. API endpoints (apps/web)

- **Legacy (no version):** `/api/health`, `/api/health/auth`, `/api/auth/login`, `/api/_debug/auth`, `/api/diag/supabase`, `/api/ai/analyze-image`, `/api/analysis/process`, `/api/projects`, `/api/projects/[id]`, `/api/projects/[id]/upload`, `/api/projects/[id]/jobs/[jobId]/trigger`, `/api/projects/[id]/media/[mediaId]/trigger`, `/api/projects/[id]/poll-status`, `/api/tenant/*` (invite, members, invitations, accept-invite, revoke).
- **v1:** `/api/v1/health`, `/api/v1/config`, `/api/v1/projects`, `/api/v1/ai/analyze-image` (re-exports `/api/ai/analyze-image`), `/api/v1/jobs/process`, `/api/v1/sync/bootstrap`, `/api/v1/sync/changes`, `/api/v1/sync/ack`, `/api/v1/media/upload-sessions`, `/api/v1/media/upload-sessions/[id]/finalize`, `/api/v1/media/[mediaId]/annotations|comments|collab`, `/api/v1/reports/[id]/analysis-status`, `/api/v1/worker`, `/api/v1/worker/tasks/today`, `/api/v1/worker/day/start|end`, `/api/v1/worker/report/create|add-media|submit`, `/api/v1/worker/sync`, `/api/v1/devices/register|unregister`, `/api/v1/billing/*`, `/api/v1/org/*`, `/api/v1/admin/*` (many sub-routes), `/api/v1/scim/[...path]`.

---

## 4. Dependency relationships (high level)

- **Routes** → lib/tenant, lib/supabase, domain or platform services.  
- **Domain** → repositories, tenant context; some use platform (jobs).  
- **Platform/jobs** → handlers, queue, AI usage, vision.  
- **Auth** → Supabase Auth, tenant_members, middleware.  
- **Contracts** → consumed by apps/web and api-client; OpenAPI from contracts.

---

## 5. Build and entry points

- **Root:** `npm run dev|build|cf:build|cf:deploy` → delegates to `apps/web`.  
- **apps/web:** `next build`, OpenNext → `.open-next/`; wrangler deploy.  
- **Cron/workers:** Job processing HTTP-triggered via `/api/v1/jobs/process`.

---

## 6. Tests

- **Unit:** Vitest under `apps/web/lib/**/*.test.ts`, `apps/web/app/api/**/*.test.ts`.  
- **E2E:** Playwright under `apps/web/tests/e2e/`.

---

## 7. Notable gaps / caveats

- **Root `lib/` vs `apps/web/lib`:** B3 documents boundary; prefer new code under `apps/web/lib`.  
- **Lite client restriction:** x-client parsed in tenant context; enforcement of allow-listed paths is layered (not a single global middleware).  
- **Construction brain / vision:** AI logic spread across `apps/web/lib/ai/`, `lib/intelligence/`; not a single legacy module tree name.
