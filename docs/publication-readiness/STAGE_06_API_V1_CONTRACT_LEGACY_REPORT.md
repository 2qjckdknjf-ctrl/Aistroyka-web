# STAGE 06 — API V1 Contract / Legacy Drift Closure Report

## 1. Goal

Assess API v1 contract stability, legacy route drift, and readiness for web/mobile clients.

## 2. Files inspected

- `apps/web/app/api/v1/**/route.ts` (inventory sample; 239 route handlers)
- `apps/web/app/api/**/route.ts` (inventory sample; 266 route handlers including legacy/non-v1)
- `apps/web/lib/api/deprecation-headers.ts`
- representative route tests:
  - `apps/web/app/api/v1/config/route.test.ts`
  - `apps/web/app/api/v1/health/route.test.ts`
  - `apps/web/app/api/health/route.test.ts`

## 3. Findings

1. API surface is broad and mostly standardized on `/api/v1/*`, but legacy `/api/*` routes are still present for compatibility.
2. Legacy deprecation headers are implemented (`Deprecation`, `Sunset`) through shared helper.
3. Canonical health path exists at `/api/v1/health` with legacy bridge `/api/health`.
4. Route inventory indicates many critical worker/sync/docs/cost/approval/copilot endpoints are present in v1 namespace.
5. Full route-by-route request/response envelope consistency audit is still pending due API surface size.

## 4. Changes made

- No code changes in this stage; performed inventory and evidence capture.

## 5. Validation commands

```bash
bun run --cwd apps/web test app/api/v1/config/route.test.ts app/api/health/route.test.ts app/api/v1/health/route.test.ts
```

## 6. Validation result

- Passed (`6/6` tests) for sampled contract-critical endpoints and legacy bridge health behavior.

## 7. Remaining gaps

1. Full API contract envelope audit (error format, field naming consistency, response validation) remains open.
2. Explicit deprecation header coverage across all legacy routes is not fully enumerated yet.
3. Mobile parity verification for all critical worker/sync endpoints remains part of subsequent stages.

## 8. Blockers

- None for repository-local inventory.

## 9. Commit hash

Pending (generated after commit in this stage).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

PARTIAL

