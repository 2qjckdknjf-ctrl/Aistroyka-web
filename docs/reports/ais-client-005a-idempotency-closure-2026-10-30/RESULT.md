# AIS-CLIENT-005A intake-draft idempotency closure — 2026-10-30

## Files changed
- `apps/web/lib/domain/preproject-extraction/preproject-extraction.service.ts`
- `apps/web/lib/domain/preproject-extraction/preproject-extraction.service.test.ts`
- `apps/web/app/api/v1/projects/[id]/preproject/extractions/route.ts`
- `apps/web/supabase/migrations/20261030230000_ais_client_005a_intake_draft_idempotency.sql`
- `STATUS.md` (+ RULE-015 closure note in same PR)

## Checks run
- vitest preproject-extraction — 6 pass
- tsc / eslint — pass
- aikido_scan_paths — 0 issues
- Hosted unique partial index applied on AISTROYKA
- CI Check on PR #482 — SUCCESS
- Independent approval: `6262265-cpu` on HEAD `ac607b55`
- Merged: #482 → `c67e0775`

## Result
Same `intake_draft_id` reuses the existing extraction run/observations (HTTP 200, `reused: true`); concurrent insert races reuse via unique violation. No automatic Graph/estimate/assignment promotion.

## Remaining blockers
- Source-linked Graph promotion of accepted observations — later CLIENT-005A slice
- LLM/photo extractors behind same contract — deferred
- Legal/store/billing 7-day — `OWNER_GATE`

## Verdict
**YES** for scoped intake-draft idempotency gap.
