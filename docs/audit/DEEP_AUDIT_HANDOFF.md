# Deep Audit Handoff

Date: 2026-05-25  
Audience: release/operator owners  
Goal: close remaining live/operator blockers and move critical risks to `closed`.

## 1) What is already green (repo-side)

- Security hardening implemented and tested:
  - `/api/v1/projects/:id/estimate` denies non-manager roles.
  - Portal finance fail-closed guards expanded across key portal routes.
  - Webhook routes fail closed in production when signature secret is missing.
  - Cron auth defaults to fail-closed in production.
- Release workflow hardening implemented:
  - production deploy is driven from successful staging workflow completion.
  - staging pilot E2E is blocking.
  - production smoke enforces `health=200`.
  - migrations preflight added to staging and production workflows.
  - production stakeholder finance sanity added as blocking gate.
- Validation completed locally:
  - `lint` pass
  - `test` pass (`1471/1471`)
  - `build` pass
  - `cf:build` pass
  - targeted security regression set pass (`28/28`)

## 2) Remaining critical closures (live/operator)

Latest live evidence already captured:

- staging success: `26402956304`
- production promotion trigger from staging: `26403104100` (`workflow_run`)
- full production pass with blocking gates: `26406727533`

### C-01 — Estimate finance boundary closure

Do now:

1. apply migration `20260525083000_phase13_estimate_results_internal_only.sql`
2. verify stakeholder cannot read `project_estimate_results`
3. run `scripts/verify/stakeholder_finance_sanity.sh` against target env
4. archive evidence in deep-audit evidence log

Close when:

- migration apply + runtime deny proof are attached.

### C-02 — Promotion gate proof

Status: `closed` (evidence captured in workflow runs listed above).

Do now:

1. run full staging deploy workflow
2. confirm blocking `pilot-smoke` + `pilot-e2e-audit` pass
3. confirm production deploy starts only after staging success
4. confirm production blocking gates pass

Close when:

- staging->production promotion proof exists in workflow logs.

### C-03 — Branch protection/ruleset proof

Do now (GitHub UI):

1. confirm effective protection/ruleset on `main`
2. confirm `CI Check` required for merge
3. confirm bypass policy is explicitly controlled

Current API snapshot note:

- `/branches/main/protection` -> `404`
- `/rulesets` -> `[]`

This is not sufficient; UI/org-level confirmation is required.

Close when:

- UI evidence is captured and linked.

### C-04 — Migration preflight rollout proof

Do now:

1. configure `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` in repository secrets
2. run staging/prod workflows after secret rollout
3. confirm `migrations-preflight` secret-check step executes (not skipped)

Close when:

- deploy run artifacts show migration preflight check step passing in both environments.

## 3) Exact execution order

1. Merge current hardening changes.
2. Apply DB migration in target environment(s).
3. Run staging deploy and verify blocking jobs.
4. Run production deploy through promotion path.
5. Run stakeholder finance sanity (if not already executed in production job logs).
6. Capture branch protection evidence in GitHub UI.
7. Update risk register statuses and closure docs.

## 4) Evidence and docs to update

Use:

- `docs/audit/DEEP_AUDIT_EVIDENCE_LOG_TEMPLATE.md`

Then update:

- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/DEEP_AUDIT_MASTER_REPORT.md`
- `docs/audit/DEEP_AUDIT_REMEDIATION_PLAN.md`
- `docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md`
- `docs/security/DEEP_AUDIT_FINANCE_ISOLATION_ADDENDUM.md`
- `docs/product/PHASE13_ROADMAP_CLOSURE.md`

## 5) Quick operator command pack

```bash
# local confidence
bun run lint
bun run test
bun run build
bun run cf:build

# stakeholder live sanity
bash scripts/verify/stakeholder_finance_sanity.sh

# optional GH visibility
gh run list --workflow "Deploy Cloudflare (Staging)" --limit 5
gh run list --workflow "Deploy Cloudflare (Production)" --limit 5
```
