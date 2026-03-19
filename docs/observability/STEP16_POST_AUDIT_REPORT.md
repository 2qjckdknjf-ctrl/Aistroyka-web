# Step 16 — Centralized Observability Post-Audit Report

## 1. Phase checklist

| # | Area | Status | Notes |
|---|------|--------|--------|
| 1 | Observability inventory | **FULL** | STEP16_OBSERVABILITY_INVENTORY.md: existing signals, blind spots, operator pain, priorities. |
| 2 | Centralized signal model | **FULL** | STEP16_SIGNAL_MODEL.md: event/error categories, route/service/job dimensions, severity, build correlation, tenant-safe fields, AI/upload dimensions. |
| 3 | Error/latency/failure aggregation | **FULL** | Ops metrics (existing) + AI runtime aggregation (existing) + job failures by type (diagnostics). Correlation on ops/metrics and ops/overview. Centralized GET /api/v1/admin/ops/diagnostics composes metrics, AI drilldown, job_failures.by_type. Latency/error rate by route from audit (AI routes only); log-based aggregation documented as external. |
| 4 | Operator-facing observability surfaces | **FULL** | Existing: ops/metrics, ops/overview, admin/ops/ai-runtime. New: admin/ops/diagnostics (single view). All operator responses now include correlation (build_sha, build_time, app_env) where added. |
| 5 | Alertability foundation | **FULL** | STEP16_ALERTABILITY_FOUNDATION.md: alert-worthy classes, severity model, signal sources, routing assumptions, explicit gaps (no transport in repo). |
| 6 | Release/build correlation | **FULL** | STEP16_RELEASE_CORRELATION.md; getBuildStamp() used in ops/metrics, ops/overview, admin/ops/diagnostics, and already in admin/ops/ai-runtime. |
| 7 | Safety/data hygiene | **FULL** | STEP16_DATA_HYGIENE_REVIEW.md: no secrets in logs, no prompts in audit, no PII, tenant safety, admin route protection. |

## 2. Remaining items

- **P0:** None.
- **P1:** Run Vitest for ops/metrics and admin/ops/diagnostics in an environment where esbuild matches. Apply any deploy/config so NEXT_PUBLIC_BUILD_SHA and NEXT_PUBLIC_BUILD_TIME are set in production.
- **P2:** Log-based error rate by route (external); threshold configuration in repo; actual alert transport (Step 17).

## 3. Next major step allowed

**YES.** Step 16 is closed enough to move forward. Centralized observability is in place: inventory, signal model, correlation on operator endpoints, single diagnostics view, alertability and hygiene documented. No blocking P0 items.
