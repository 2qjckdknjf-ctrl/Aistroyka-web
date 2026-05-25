# Deep Audit Execution Runbook

Date: 2026-05-25  
Purpose: execute live/operator closure for deep-audit risks that remain `in_progress` after repo-side hardening.

## 1) Target risks to close

- `C-01` estimate-route finance boundary (live DB + runtime proof)
- `C-02` staging -> production promotion proof
- `C-04` migrations-preflight proof in deploy pipeline
- `H-01` expanded portal finance guard evidence in staging/prod
- `H-03` webhook fail-closed production behavior proof
- `H-04` cron fail-closed production behavior proof
- `C-03` branch protection / required checks confirmation (UI/operator)

Primary tracking docs:

- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md`
- `docs/audit/DEEP_AUDIT_MASTER_REPORT.md`
- `docs/audit/DEEP_AUDIT_EVIDENCE_LOG_TEMPLATE.md`

## 2) Preconditions

Required secrets/config must exist in repository/workflow/runtime:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `PILOT_SMOKE_BEARER_STAGING`
- `PILOT_SMOKE_BEARER_PRODUCTION`
- `STAKEHOLDER_SMOKE_EMAIL` and `STAKEHOLDER_SMOKE_PASSWORD` (or valid production fallback pair)
- `CRON_SECRET`
- `WEBHOOK_INCOMING_SECRET`
- `REQUIRE_CRON_SECRET=true` in production

## 3) Step-by-step closure flow

### Step A — Apply migration and verify DB boundary (C-01)

Migration:

- `apps/web/supabase/migrations/20260525083000_phase13_estimate_results_internal_only.sql`

Verification requirements:

1. stakeholder JWT cannot read `project_estimate_results`.
2. manager/internal role paths still function.
3. attach output/screenshots to audit notes.

Expected evidence:

- Supabase SQL result/logs showing denied stakeholder read.
- link/reference in `docs/audit/*`.

### Step B — Execute staged release path and capture proof (C-02, C-04)

1. Trigger staging deploy (main or workflow_dispatch).
2. Confirm blocking jobs pass:
   - `migrations-preflight`
   - `pilot-smoke`
   - `pilot-e2e-audit` (blocking)
3. Confirm production deploy starts only from successful staging workflow completion.
4. Confirm production blocking jobs pass:
   - `migrations-preflight`
   - `pilot-smoke` (strict health 200)
   - `stakeholder-finance-sanity`

Expected evidence:

- staging run URL + successful job list
- production run URL + successful job list
- proof that production was not independently triggered by direct push flow

### Step C — Validate stakeholder finance runtime checks (C-01, H-01)

Run:

```bash
bash scripts/verify/stakeholder_finance_sanity.sh
```

Expected:

- `/api/v1/projects/:id/costs` => `403` (`GET` + `POST`)
- `/api/v1/projects/:id/estimate` => `403`
- portal payload denylist scan passes

Expected evidence:

- command output log or CI artifact link

### Step D — Validate webhook/cron fail-closed behavior (H-03, H-04)

Webhook:

- In production, if `WEBHOOK_INCOMING_SECRET` missing and bypass not enabled:
  - `/api/v1/webhooks/incoming` returns `503` config error.

Cron:

- In production with no/invalid `x-cron-secret`:
  - `/api/v1/admin/jobs/cron-tick` returns `403`.

Expected evidence:

- curl command outputs or workflow logs with statuses.

### Step E — Confirm branch protection and required checks (C-03)

In GitHub UI:

1. verify branch protection/ruleset for `main`
2. ensure `CI Check` is required for merge
3. confirm no conflicting bypass settings

Expected evidence:

- screenshot(s) or explicit operator note in release docs.
- optional API snapshot for context:
  - `gh api repos/2qjckdknjf-ctrl/Aistroyka-web/branches/main/protection`
  - `gh api repos/2qjckdknjf-ctrl/Aistroyka-web/rulesets`

Important: API may report `404 Branch not protected` or empty repository rulesets while organization-level protections are still active. UI confirmation is authoritative for closure.

## 4) Suggested command pack (operator)

```bash
# 1) Local confidence preflight
bun run lint
bun run test
bun run build
bun run cf:build

# 2) Stakeholder finance live sanity
bash scripts/verify/stakeholder_finance_sanity.sh

# 3) Optional quick cron probe (without secret should be 403 in prod)
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "https://aistroyka.ai/api/v1/admin/jobs/cron-tick"

# 4) Workflow visibility (if gh auth configured)
gh run list --workflow "Deploy Cloudflare (Staging)" --limit 5
gh run list --workflow "Deploy Cloudflare (Production)" --limit 5
```

## 5) Closure update protocol

After evidence is collected:

0. record the run in `docs/audit/DEEP_AUDIT_EVIDENCE_LOG_TEMPLATE.md`
1. update statuses in `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
2. reflect closure deltas in:
   - `docs/audit/DEEP_AUDIT_MASTER_REPORT.md`
   - `docs/audit/DEEP_AUDIT_REMEDIATION_PLAN.md`
   - `docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md`
3. align Phase 13 closure narrative in:
   - `docs/product/PHASE13_ROADMAP_CLOSURE.md`

## 6) Definition of closure-ready

Runbook execution is complete when:

- all repo-side checks remain green,
- live/operator evidence exists for every required critical/high item,
- risk register status transitions are justified and traceable.
