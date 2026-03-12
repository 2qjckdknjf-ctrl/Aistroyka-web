# Release Audit — Phase 1: Repository Map

**Generated:** Release Readiness Audit  
**Scope:** AISTROYKA monorepo (Next.js 15, OpenNext/Cloudflare, Supabase, iOS).

---

## 1. Directory and Module Map

| Path | Type | Responsibility | Active / Legacy |
|------|------|----------------|-----------------|
| **apps/web** | Primary app | Next.js 15 web app, API routes, lib, Supabase migrations, wrangler | **Active** |
| **apps/web/app** | Routes | `[locale]` pages, `api/` route handlers | Active |
| **apps/web/lib** | Core | tenant, auth, supabase, domain, platform, ai, observability, sre | Active |
| **apps/web/components** | UI | Shared React components | Active |
| **apps/web/supabase/migrations** | DB | 46 SQL migrations (20260303–20260306) | Active |
| **packages/contracts** | Shared | Zod schemas, API types | Active |
| **packages/contracts-openapi** | Shared | OpenAPI build from contracts | Active |
| **packages/api-client** | Shared | Typed HTTP client for API consumers | Active |
| **lib** (repo root) | Shared | Supabase server/browser/rpc/env (thin; apps/web has its own lib) | Unclear / possible duplicate |
| **ios/AiStroykaWorker** | Mobile | Manager app (Swift) | Active |
| **ios/WorkerLite** | Mobile | Worker Lite app (renamed to AiStroykaWorker in progress) | Active, rename in progress |
| **archive/legacy-app** | Archive | Old dashboard, api, auth routes | Legacy |
| **docs** | Docs | ADR, runbooks, reports, pilot, hardening | Reference |
| **scripts** | Ops | smoke, dev, db, mobile scripts | Active |
| **components**, **public** (root) | Legacy? | NavLogout, etc. | Unclear ownership |
| **engine** | — | Not present at repo root (referenced in older SYSTEM_REPOSITORY_MAP) | N/A |
| **app** (root) | — | Not present at repo root | N/A |

---

## 2. Dependency Graph (Subsystems)

```
Root package.json (bun, workspaces: apps/web, packages/*)
  └── apps/web
        ├── @aistroyka/contracts (file:../../packages/contracts)
        ├── next, react, @supabase/ssr, @supabase/supabase-js, stripe, zod
        └── wrangler (dev), @playwright/test, vitest

packages/contracts  →  packages/contracts-openapi (build)
packages/api-client →  (consumes contracts; not in root workspaces for build order)

iOS: standalone Xcode projects; no monorepo workspace dependency.
```

---

## 3. API Route Inventory (apps/web)

- **Legacy (no version):** `/api/health`, `/api/health/auth`, `/api/auth/login`, `/api/_debug/auth`, `/api/diag/supabase`, `/api/ai/analyze-image`, `/api/analysis/process`, `/api/projects`, `/api/projects/[id]`, `/api/projects/[id]/upload`, `/api/projects/[id]/jobs/[jobId]/trigger`, `/api/projects/[id]/media/[mediaId]/trigger`, `/api/projects/[id]/poll-status`, `/api/tenant/*` (invite, members, invitations, accept-invite, revoke).
- **v1:** 80+ route files under `/api/v1/*`: health, config, projects, ai, jobs, sync, media, reports, worker, devices, billing, org, admin (usage, alerts, analytics, audit-logs, exports, flags, jobs/cron-tick, metrics, privacy, push, security, slo, tenants), scim, tasks, notifications, workers.

**Auth pattern:** Most v1 and tenant routes use `getTenantContextFromRequest` + `requireTenant`; admin routes add `requireAdmin`. Public/unauthenticated: `/api/health`, `/api/health/auth`, `/api/auth/login`, `/api/_debug/auth` (gated by `isDebugAuthAllowed`), `/api/diag/supabase`, `/api/v1/config`, `/api/v1/billing/webhook`. Cron: `/api/v1/admin/jobs/cron-tick` (cron secret), `/api/v1/jobs/process` (tenant + cron or tenant auth).

---

## 4. Scripts Inventory

| Script | Purpose |
|--------|---------|
| scripts/smoke/*.sh, smoke-v1.sh, auth-smoke.sh, verify-prod-*.sh | Smoke / prod verification |
| apps/web/scripts/smoke-prod.sh, smoke-staging.sh, dashboard_smoke.sh | Web smoke |
| apps/web/scripts/health-check.sh, ensure-env-local.sh | Health, env setup |
| apps/web/scripts/run-migrations.mjs, set-supabase-auth-urls.mjs | DB/auth config |
| apps/web/scripts/set-cf-secrets.sh, cf-dns-*.mjs | Cloudflare deploy |
| apps/web/scripts/*.cjs (fix-standalone, patch-worker, etc.) | CF/OpenNext build patches |
| scripts/bootstrap_local_supabase.sh, dev/kill-hanging.sh | Local dev |

---

## 5. CI/CD and Deployment

- **.github/workflows:** deploy.yml (apps/web), ci.yml (apps/web), snapshot-backup.yml, update-lockfile-linux.yml, deploy-cloudflare-staging.yml, deploy-cloudflare-prod.yml.
- **Build:** Root `build` → contracts then apps/web build. `cf:build` → Next standalone + opennextjs-cloudflare + patches.
- **Deploy:** wrangler deploy (dev/staging/production); production uses patched deploy (wrangler.deploy.toml).

---

## 6. Tests

- **Unit:** Vitest; `apps/web` — `*.test.ts` under lib and app/api.
- **E2E:** Playwright in apps/web (e.g. ai-smoke.spec.ts).
- **Config:** vitest.config.ts, playwright in apps/web.

---

## 7. Suspected Duplicate / Unclear

- **Root `lib/`** vs **apps/web/lib/** — Root lib has supabase server, rpc, env; apps/web has full lib (tenant, domain, platform). Risk of drift or duplicate usage.
- **Legacy API routes** (`/api/projects`, `/api/analysis/process`, etc.) alongside `/api/v1/*` — Two patterns; deprecation headers present on some.
- **SYSTEM_REPOSITORY_MAP** references `app/` and `engine/` at repo root — Not present in current tree; doc may be outdated.

---

## 8. Suspected Abandoned / Dead Code

- **archive/legacy-app** — Explicitly archived.
- **apps/web/audit_*_artifacts** — Audit/backup folders (e.g. audit_web_p0_perfect_artifacts, audit_admin_ai_artifacts); not main app code.
- **WorkerLite** iOS: Many deleted files in git status (WorkerLiteApp, ContentView, etc.); replacement with AiStroykaWorker naming in progress — possible dead or transitional code in WorkerLite tree.

---

## 9. Env and Config

- **Env templates:** .env.example (root), apps/web/.env.example, .env.local.example, .env.production.example, .env.staging.example.
- **Wrangler:** wrangler.toml (root), apps/web/wrangler.toml, apps/web/wrangler.deploy.toml.

---

## 10. Mobile

- **iOS:** AiStroykaWorker (manager), WorkerLite (worker app; renaming to AiStroykaWorker). No `engine/` or root `app/` in current repo.
- **Android:** No top-level android directory found; mobile scripts reference smoke-mobile and push; Android may be minimal or external.
