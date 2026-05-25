# Deep Audit Release Bundle

Date: 2026-05-25  
Purpose: stage only deep-audit implementation changes and exclude unrelated workspace noise.

## Include in deep-audit commit

### Workflows

- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`
- `.github/workflows/pilot-smoke.yml`

### Web/API hardening

- `apps/web/app/api/v1/projects/[id]/estimate/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/progress/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/documents/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/decisions/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/estimates/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/change-orders/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/proof/route.ts`
- `apps/web/app/api/v1/webhooks/incoming/route.ts`
- `apps/web/app/api/webhooks/incoming/route.ts`
- `apps/web/lib/api/cron-auth.ts`

### Scripts and env docs

- `scripts/smoke/pilot_launch.sh`
- `apps/web/scripts/smoke-prod.sh`
- `scripts/verify/stakeholder_finance_sanity.sh`
- `docs/ENVIRONMENT-VARIABLES.md`

### Tests

- `apps/web/app/api/v1/projects/[id]/estimate/route.test.ts`
- `apps/web/app/api/v1/portal/projects/[id]/progress/route.test.ts`
- `apps/web/app/api/v1/portal/projects/[id]/documents/route.test.ts`
- `apps/web/app/api/v1/portal/projects/[id]/decisions/route.test.ts`
- `apps/web/app/api/v1/portal/projects/[id]/estimates/route.test.ts`
- `apps/web/app/api/v1/portal/projects/[id]/change-orders/route.test.ts`
- `apps/web/app/api/v1/portal/projects/[id]/proof/route.test.ts`
- `apps/web/app/api/v1/webhooks/incoming/route.test.ts`
- `apps/web/lib/api/cron-auth.test.ts`

### Migration

- `apps/web/supabase/migrations/20260525083000_phase13_estimate_results_internal_only.sql`

### Audit/security deliverables

- `docs/security/DEEP_AUDIT_FINANCE_ISOLATION_ADDENDUM.md`
- `docs/audit/DEEP_AUDIT_MASTER_REPORT.md`
- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/DEEP_AUDIT_REMEDIATION_PLAN.md`
- `docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md`
- `docs/audit/DEEP_AUDIT_EXECUTION_RUNBOOK.md`
- `docs/audit/DEEP_AUDIT_EVIDENCE_LOG_TEMPLATE.md`
- `docs/audit/DEEP_AUDIT_HANDOFF.md`
- `docs/audit/DEEP_AUDIT_RELEASE_BUNDLE.md`

## Exclude from deep-audit commit

- `AGENTS.md` (continual-learning maintenance update, not part of deep-audit implementation bundle)
- `package-lock.json` (unrelated lockfile noise for this bundle)
- `scripts/debug/capture-failing-command.mjs` (existing unrelated debug artifact)

## Stage command (single bundle)

```bash
git add \
  .github/workflows/deploy-cloudflare-staging.yml \
  .github/workflows/deploy-cloudflare-prod.yml \
  .github/workflows/pilot-smoke.yml \
  apps/web/app/api/v1/projects/[id]/estimate/route.ts \
  apps/web/app/api/v1/portal/projects/[id]/progress/route.ts \
  apps/web/app/api/v1/portal/projects/[id]/documents/route.ts \
  apps/web/app/api/v1/portal/projects/[id]/decisions/route.ts \
  apps/web/app/api/v1/portal/projects/[id]/estimates/route.ts \
  apps/web/app/api/v1/portal/projects/[id]/change-orders/route.ts \
  apps/web/app/api/v1/portal/projects/[id]/proof/route.ts \
  apps/web/app/api/v1/webhooks/incoming/route.ts \
  apps/web/app/api/webhooks/incoming/route.ts \
  apps/web/lib/api/cron-auth.ts \
  scripts/smoke/pilot_launch.sh \
  apps/web/scripts/smoke-prod.sh \
  scripts/verify/stakeholder_finance_sanity.sh \
  docs/ENVIRONMENT-VARIABLES.md \
  apps/web/app/api/v1/projects/[id]/estimate/route.test.ts \
  apps/web/app/api/v1/portal/projects/[id]/progress/route.test.ts \
  apps/web/app/api/v1/portal/projects/[id]/documents/route.test.ts \
  apps/web/app/api/v1/portal/projects/[id]/decisions/route.test.ts \
  apps/web/app/api/v1/portal/projects/[id]/estimates/route.test.ts \
  apps/web/app/api/v1/portal/projects/[id]/change-orders/route.test.ts \
  apps/web/app/api/v1/portal/projects/[id]/proof/route.test.ts \
  apps/web/app/api/v1/webhooks/incoming/route.test.ts \
  apps/web/lib/api/cron-auth.test.ts \
  apps/web/supabase/migrations/20260525083000_phase13_estimate_results_internal_only.sql \
  docs/security/DEEP_AUDIT_FINANCE_ISOLATION_ADDENDUM.md \
  docs/audit/DEEP_AUDIT_MASTER_REPORT.md \
  docs/audit/DEEP_AUDIT_RISK_REGISTER.md \
  docs/audit/DEEP_AUDIT_REMEDIATION_PLAN.md \
  docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md \
  docs/audit/DEEP_AUDIT_EXECUTION_RUNBOOK.md \
  docs/audit/DEEP_AUDIT_EVIDENCE_LOG_TEMPLATE.md \
  docs/audit/DEEP_AUDIT_HANDOFF.md \
  docs/audit/DEEP_AUDIT_RELEASE_BUNDLE.md
```
