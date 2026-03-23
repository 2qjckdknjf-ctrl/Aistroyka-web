# Phase 7 — Enterprise operations / production hardening (inventory)

**Date:** 2026-03-23  
**Tracks:** [AISAA-15](/AISAA/issues/AISAA-15)  
**Parent:** [AISAA-1](/AISAA/issues/AISAA-1)

**Production truth gate:** [AISAA-11](/AISAA/issues/AISAA-11) (P0 migration + RLS + health) is **blocked** in Paperclip. This inventory describes **repo reality** and **documented live state**; it does **not** claim green enterprise ops in production until that P0 closes.

## 1. Health and readiness

| Surface | Location | Role |
|--------|----------|------|
| Unified health | `GET /api/health`, `GET /api/v1/health` | Shared controller `apps/web/lib/controllers/health.ts`: anon Supabase client, `tenants` select `limit(1)`, build stamp, AI config flags, `503` when DB check fails |
| Release env validation | `scripts/validate-release-env.mjs`, `apps/web/lib/config/release-env.ts` | Production env safety catalog (forbids `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES`, etc.) |

**Documented live issue:** RLS recursion on `tenant_members` and migration lag — see [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md), [PHASE3_LIVE_POST_AUDIT.md](./PHASE3_LIVE_POST_AUDIT.md).

## 2. Logging and error visibility

| Mechanism | Location | Notes |
|-----------|----------|--------|
| Structured logging | `apps/web/lib/observability/logger.ts` | Base for JSON-ish structured logs |
| Error capture | `apps/web/lib/observability/error-tracking.ts` | `captureException` → structured event; **comment in code** — extensible to Sentry; **no** bundled APM in repo |
| Request timing / trace hooks | `request-timing.ts`, `trace.ts`, `ai-telemetry.ts` | Supporting instrumentation patterns |
| Client env | `LOG_LEVEL` | Documented in [docs/ENVIRONMENT-VARIABLES.md](../ENVIRONMENT-VARIABLES.md) |

**Gap (truth):** No first-class metrics backend (Prometheus/Datadog), no Sentry DSN wiring in tree — ops visibility is primarily **logs + app-owned tables/APIs** below.

## 3. Ops metrics, diagnostics, and admin surfaces

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /api/v1/ops/overview` | Tenant ops | Operational overview (`lib/ops/ops-overview.repository`) |
| `GET /api/v1/ops/metrics` | Tenant ops | Time-bounded ops metrics |
| `GET /api/v1/admin/ops/diagnostics` | **Admin** tenant user | Build correlation, ops metrics, AI runtime audit aggregate, failed jobs, incident hints (`incident-hints`) |
| `GET /api/v1/admin/ops/ai-runtime` | **Admin** | AI runtime diagnostics |

Tests: `apps/web/app/api/v1/admin/ops/diagnostics/route.test.ts` (contract smoke).

**Security posture:** Admin routes use `requireAdmin`; diagnostics are **not** public. Production must keep `ENABLE_DIAG_ROUTES` / `DEBUG_DIAG` off per env docs.

## 4. CI/CD and operational safety nets

| Workflow | Trigger | Role |
|----------|---------|------|
| [`.github/workflows/deploy-cloudflare-prod.yml`](../../.github/workflows/deploy-cloudflare-prod.yml) | `push` to `main`, `workflow_dispatch` | Canonical prod: Bun install, OpenNext build, Wrangler deploy, env precheck via `scripts/release/check-env-config.sh deploy-production` |
| [`.github/workflows/deploy-cloudflare-staging.yml`](../../.github/workflows/deploy-cloudflare-staging.yml) | Staging path | Same family for non-prod |
| [`.github/workflows/pilot-smoke.yml`](../../.github/workflows/pilot-smoke.yml) | Reusable | **Blocking** post-deploy smoke: `scripts/smoke/pilot_launch.sh` + Bearer JWT secret |
| [`.github/workflows/apply-migrations.yml`](../../.github/workflows/apply-migrations.yml) | **`workflow_dispatch` only** | Supabase CLI `db push`; preflight list + dry-run; **not** auto on every deploy |
| [`.github/workflows/snapshot-backup.yml`](../../.github/workflows/snapshot-backup.yml) | Schedule + manual | Git snapshot branches (code), **not** DB backups |

**Authoritative narrative:** [CLOSURE_A_RELEASE_RECONCILIATION.md](./CLOSURE_A_RELEASE_RECONCILIATION.md) — Cloudflare + GHA prod, migrations manual, Vercel secondary.

## 5. Runbooks and ops docs (repo)

| Doc | Topic |
|-----|--------|
| [docs/closure/A1_MIGRATION_APPLY_RUNBOOK.md](../closure/A1_MIGRATION_APPLY_RUNBOOK.md) | Migration apply procedure |
| [docs/closure/A1_MIGRATION_APPLY_STRATEGY.md](../closure/A1_MIGRATION_APPLY_STRATEGY.md) | Strategy |
| [docs/closure/A1_MIGRATION_APPLY_VALIDATION.md](../closure/A1_MIGRATION_APPLY_VALIDATION.md) | Validation |
| [docs/release/PHASE3_PILOT_SMOKE_USAGE.md](../release/PHASE3_PILOT_SMOKE_USAGE.md) | Pilot smoke secrets and usage |
| [docs/ops/BILLING_PILOT_RUNBOOK.md](../ops/BILLING_PILOT_RUNBOOK.md) | Billing pilot operations |
| [docs/ENVIRONMENT-VARIABLES.md](../ENVIRONMENT-VARIABLES.md) | Secrets / forbidden debug flags |
| Architecture under `docs/architecture/` | Billing, plan fit, entry routing, etc. (design truth; not incident runbooks) |

## 6. Cross-links to prior phase truth

| Topic | Doc |
|-------|-----|
| Live DB / health | [PHASE3_LIVE_MATRIX.md](./PHASE3_LIVE_MATRIX.md), [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md) |
| Release pipeline | [CLOSURE_A_RELEASE_VALIDATION.md](./CLOSURE_A_RELEASE_VALIDATION.md), [CLOSURE_A_RELEASE_READINESS.md](./CLOSURE_A_RELEASE_READINESS.md) |
| Intelligence + ops API inventory | [PHASE4_INTELLIGENCE_INVENTORY.md](./PHASE4_INTELLIGENCE_INVENTORY.md) |

## 7. Explicit non-claims

- **Production is not “enterprise hardened”** while [AISAA-11](/AISAA/issues/AISAA-11) is blocked: health, RLS, and migration parity are the ceiling for honest ops status.
- **No** dedicated on-call paging, status page, or DRP in this inventory — not evidenced as first-class repo artifacts.
