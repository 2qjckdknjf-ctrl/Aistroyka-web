# AI Safe Next Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Tiny PR

After PR #109 is merged and post-merge validation passes, the next safest AI PR is:

**AI Flywheel schema and access-control audit PR, flags off, no runtime activation.**

This should not be a broad merge from `ai/gold-memory-mvp`, `ai/expert-review-queue-mvp`, or `ai/flywheel-final-tail-closure`.

## Proposed Scope

Audit/prepare only:

- Review and, if needed, rewrite `20260617120000_ai_flywheel_foundation.sql` into a fresh migration suitable for the current live migration timeline.
- Add route/policy tests for training consent access control without enabling UI broadly.
- Add explicit docs/runbook for staging migration validation.
- Keep all AI Flywheel flags default off.
- Do not include Gold Memory prompt injection or Expert Review Queue UI in the first PR.

## Likely Files If Implementation Is Later Approved

Do not edit these in this audit branch. If approved later, a minimal PR may involve:

- `apps/web/supabase/migrations/<new_ai_flywheel_foundation>.sql`
- `apps/web/lib/platform/ai-flywheel/flags.ts`
- `apps/web/lib/platform/ai-flywheel/consent.ts`
- `apps/web/lib/platform/ai-flywheel/training-consent.service.ts`
- `apps/web/app/api/v1/tenant/ai-training-consent/route.ts`
- focused tests for the above
- runbook under `docs/ai-flywheel/` or `docs/runbooks/`

## Required Tests

- Consent defaults deny.
- Owner/admin allowed to read/update consent.
- Member/viewer/stakeholder/customer/anonymous denied.
- Missing service-role client returns safe unavailable response.
- Audit event contains metadata only.
- Route behavior is safe with flags off or schema unavailable.
- Customer finance isolation tests remain green.

## Blocked Items

Remain deferred:

- Gold Memory table and retrieval.
- Gold Memory write/read/prompt injection flags.
- Expert Review Queue table and admin UI.
- Dataset export and shadow mode.
- Any mobile AI feedback expansion.
- Any production/live AI activation claim.

## No Broad Merge Rule

Broad AI branch merge safe: NO.

Reasons:

- AI branches include schema, admin UI, runtime services, docs, and in some cases unrelated mobile/design changes.
- The remote/local Gold Memory branch variants diverge.
- Migration and RLS behavior has not been validated against live/staging.
- Customer finance and PII controls need focused proof before persisted training artifacts exist.

## Slice Verdict

Next safe slice: schema/access-control audit PR with flags off, starting from merged PR #109 baseline.

Safe before PR #109 merges: NO.
