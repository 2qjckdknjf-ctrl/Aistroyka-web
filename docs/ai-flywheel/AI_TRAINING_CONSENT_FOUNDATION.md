# AI Training Consent Foundation

**Date:** 2026-06-17

## Schema change

Migration: `apps/web/supabase/migrations/20260617120000_ai_flywheel_foundation.sql`

```sql
alter table public.tenants
  add column if not exists ai_training_consent boolean not null default false;
```

- **Default:** `false` (deny)
- **Append-only:** column add only; no destructive changes

## Helper location

| Helper | File |
|--------|------|
| `trainingConsentFilter()` | `apps/web/lib/platform/ai-flywheel/consent.ts` |
| `tenantHasTrainingConsent()` | same |
| `filterTenantsWithTrainingConsent()` | same |
| `auditTrainingConsentChange()` | same → `audit_logs` via `emitAudit` |

## Rules

- `trainingConsentFilter()` is the **single shared export filter** — no copy-paste consent SQL in export paths
- Default deny: only explicit `ai_training_consent = true` passes
- Covered by `consent.test.ts`

## Audit behavior

Consent changes emit `ai_training_consent_change` to `audit_logs` with:
- `previous_consent`, `new_consent` (booleans only)
- No PII, no prompts

## Remaining UI / backoffice work (deferred)

- Client apps sending optional preference-pair fields on `/api/v1/ai/feedback` when managers edit AI output
- DPA/legal review for production consent rollout copy
- Platform owner audit view for consent rates

## UI (closure sprint)

- Page: `/admin/ai/training-consent` — see `AI_TRAINING_CONSENT_UI_REPORT.md`
- API: `/api/v1/tenant/ai-training-consent`
