# Deep Audit Closure Checklist

Date: 2026-05-25  
Purpose: operational checklist to move deep-audit risks from `in_progress` to `closed` with verifiable evidence.

## 1) Scope covered by this checklist

- C-01: estimate-route finance leak + RLS alignment
- C-02: staging -> production promotion gate
- C-04: migrations preflight gate in deploy workflows
- C-03: branch protection / required checks enforcement proof
- H-01: expanded fail-closed finance guards across portal routes
- H-02 (partial): staging E2E now blocking; AI gate remains non-blocking by policy
- H-03/H-04: webhook and cron production fail-closed defaults

Primary references:

- `docs/audit/DEEP_AUDIT_MASTER_REPORT.md`
- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/DEEP_AUDIT_REMEDIATION_PLAN.md`
- `docs/audit/DEEP_AUDIT_EXECUTION_RUNBOOK.md`
- `docs/security/DEEP_AUDIT_FINANCE_ISOLATION_ADDENDUM.md`

## 2) Preflight (local)

From repository root:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

Targeted security regressions:

```bash
bun run --cwd apps/web test "app/api/v1/projects/[id]/estimate/route.test.ts"
bun run --cwd apps/web test "app/api/v1/portal/projects/[id]/progress/route.test.ts"
bun run --cwd apps/web test "app/api/v1/portal/projects/[id]/documents/route.test.ts"
bun run --cwd apps/web test "app/api/v1/portal/projects/[id]/decisions/route.test.ts"
bun run --cwd apps/web test "app/api/v1/portal/projects/[id]/estimates/route.test.ts"
bun run --cwd apps/web test "app/api/v1/portal/projects/[id]/change-orders/route.test.ts"
bun run --cwd apps/web test "app/api/v1/portal/projects/[id]/proof/route.test.ts"
bun run --cwd apps/web test "app/api/v1/webhooks/incoming/route.test.ts"
bun run --cwd apps/web test "lib/api/cron-auth.test.ts"
```

## 3) Database rollout (required for C-01 closure)

Apply migration:

- `apps/web/supabase/migrations/20260525083000_phase13_estimate_results_internal_only.sql`

Post-apply verification (stakeholder JWT):

1. Direct select from `project_estimate_results` should be denied for stakeholder.
2. Internal manager/service paths still work as expected.
3. Record evidence in `docs/audit/*` and `docs/security/*`.

## 4) Workflow gate verification (required for C-02 closure)

Expected behavior after rollout:

1. `Deploy Cloudflare (Staging)` runs.
2. Blocking jobs pass:
   - `pilot-smoke`
   - `pilot-e2e-audit` (now blocking)
3. Only then `Deploy Cloudflare (Production)` can start (triggered by successful staging workflow completion).
4. Production blocking jobs pass:
   - `pilot-smoke` with strict health (`200` only)
   - `stakeholder-finance-sanity`
5. Staging/production deploy jobs pass `migrations-preflight` before build/deploy.

Evidence to capture:

- GitHub Actions run URLs and job summaries for staging + production.
- Confirmation that production did not run from direct push path independently.

## 5) Live security sanity (required for C-01 / H-01 closure)

Run:

```bash
bash scripts/verify/stakeholder_finance_sanity.sh
```

Expected:

- `/api/v1/me` role is `stakeholder`
- `/api/v1/projects/:id/costs` -> `403` (`GET` and `POST`)
- `/api/v1/projects/:id/estimate` -> `403`
- `/api/v1/portal/projects/:id` payload passes denylist scan

## 5.1) Branch protection proof (required for C-03 closure)

Required checks:

1. `main` has effective protection/ruleset in GitHub UI.
2. `CI Check` is required for merge.
3. bypass configuration (if any) is explicitly approved.

Evidence to capture:

- screenshots or operator note from GitHub branch/ruleset UI.
- optional API snapshot (reference only, not sufficient by itself):
  - `gh api repos/2qjckdknjf-ctrl/Aistroyka-web/branches/main/protection`
  - `gh api repos/2qjckdknjf-ctrl/Aistroyka-web/rulesets`

Note: API can show `404 Branch not protected` and empty repo rulesets while org-level policies still apply; UI confirmation remains required.

## 6) Risk status transition rules

Move risk states only when all evidence exists:

- C-01 -> `closed` when:
  - route guard merged,
  - migration applied,
  - live stakeholder sanity pass captured.
- C-02 -> `closed` when:
  - staging->prod promotion path proven by workflow evidence.
- C-04 -> `closed` when:
  - migrations-preflight proves required env in both staging/prod deploy runs,
  - migration apply workflow/evidence is attached for the deployment window.
- C-03 -> `closed` when:
  - branch protection / ruleset evidence is captured from GitHub UI,
  - required `CI Check` enforcement on `main` is confirmed.
- H-01 -> `closed` when:
  - portal route guards and tests are in CI,
  - at least one full staging run proves no regression.
- H-03/H-04 -> `closed` when:
  - production env values and deploy run logs confirm fail-closed behavior,
  - webhook/cron hardening tests are green in CI.

## 7) Documentation closure updates

After successful rollout, update:

- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/DEEP_AUDIT_MASTER_REPORT.md`
- `docs/audit/DEEP_AUDIT_REMEDIATION_PLAN.md`
- `docs/security/DEEP_AUDIT_FINANCE_ISOLATION_ADDENDUM.md`

And synchronize Phase-13 closure narrative in:

- `docs/product/PHASE13_ROADMAP_CLOSURE.md`

## 8) Final gate before marking done

Do not mark deep-audit criticals as closed if any of the following is missing:

- migration apply evidence,
- live stakeholder sanity run output,
- staging->prod promotion run proof,
- explicit owner signoff on updated risk register.

## 9) Completed in-repo validation evidence

As of 2026-05-25, repository-side validation is green:

- lint/test/build/cf:build pass locally,
- estimate-route deny regression test pass,
- expanded portal finance-guard route tests pass,
- webhook/cron hardening tests pass.

Remaining closure work is primarily live/operator evidence and policy confirmation (GitHub rulesets, deployed migration state, production gate runs).
