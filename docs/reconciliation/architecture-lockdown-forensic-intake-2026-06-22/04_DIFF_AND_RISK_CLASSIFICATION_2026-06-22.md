# Diff and Risk Classification

**Date:** 2026-06-22

## Branch available for diff

**Yes:** `origin/cursor/aistroyka-system-maturity-7957` vs `origin/main`

**Not on main:** entire branch (584 commits on `main` not in branch tip).

## Diff summary

```
78 files changed, 8319 insertions(+), 589 deletions(-)
```

Merge-base: `a5bfc15d8a60a81696cf2998fef0b2adc987cd82`

## Changed file categories

| Category | Examples | Count (approx.) |
|----------|----------|-----------------|
| API routes | `/api/v1/reports`, `/api/v1/media/*`, `/api/v1/sync/*`, `/api/tenant/*`, `/api/v1/worker/sync`, AI request routes | ~25 route files |
| Domain services | `report.service.ts`, `device.service.ts`, `annotation.service.ts`, `worker-sync.service.ts`, `tenant.service.ts` | ~15+ |
| Repositories | `device.repository.ts`, `annotation.repository.ts`, `tenant.repository.ts`, `worker-sync.repository.ts` | ~10+ |
| Platform | `apps/web/lib/platform/ai/ai-request.service.ts`, `job.repository.ts` | 2+ |
| Migrations | `20260307000000_fix_missing_rls_and_indexes.sql` | 1 (**live DB risk if applied ad hoc**) |
| Docs | 20+ architecture/audit markdown files | ~20 |

## Route / service / repository impact

| Impact area | Severity | Rationale |
|-------------|----------|-----------|
| Tenant invite/members/revoke routes | **High** | Auth + tenancy boundary changes |
| Sync + worker routes | **High** | Mobile reconciliation surface |
| Media annotations/comments/collab | **High** | Data mutation paths |
| Reports + AI request routes | **High** | Core product + AI governance |
| New repositories/services | **Medium–High** | Layer refactor without current-main CI proof |

## Auth / security impact

- Touches tenant invitation and member management APIs.
- Adds/modifies RLS-related migration on branch — **must not apply** without Supabase audit on active project **AISTROYKA**.
- No evidence branch was revalidated against post-#109 / #120 middleware and security header baseline.

## Stale-base risk

| Metric | Value | Risk |
|--------|-------|------|
| Commits on `main` not in branch | **584** | **Critical** — merge would miss reconciliation, security headers, ops runbook, pilot fixes |
| Commits on branch not in `main` | **17** | Isolated architecture sprint |
| Last known merge-base | `a5bfc15d` | Predates PR #109 baseline integration |

**Broad merge of this branch onto current `main` is unsafe** without full rebase, slice plan, CI, and staged review.

## If no branch (hypothetical)

N/A — branch exists but is **not integrated**. Current `main` has **no architecture lockdown diff** to certify.

## Classification

| Question | Answer |
|----------|--------|
| Broad architecture merge safe? | **NO** |
| Small verified slices after rebase? | **Possible** (future work, not this intake) |
| Diff available for lockdown on `main`? | **NO** (lockdown not merged) |
