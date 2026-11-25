# AIS-EVID-002 / AIS-VISION-003 inventory — 2026-11-25

Hard audit before expanding AI evidence scope (plan queue after PILOT-001 receipts).

## Candidate SHA / environment

| Field | Value |
|---|---|
| Tree tip at audit | `8cb0c302` (#535 PILOT-001 evidence on main) |
| Staging/prod runtime | `buildStamp.sha7=91ff124` |
| Live provider gate (local, no JWT/env) | `--require-live` → NO-GO (`auth_missing`) — expected without smoke auth |
| Live provider gate (staging + SMOKE_*) | `BASE_URL=https://staging.aistroyka.ai` + smoke JWT → **GO** (`provider=vision_router`, `model=gpt-4o-mini`, `fallback_count=0`, no `X-AI-Fallback-Reason`) |

## Verdict

| Surface | Status |
|---|---|
| Durable persist + idempotent retry (media analysis) | **CODE_PRESENT** |
| Human review + correction provenance (CORRECTION-009) | **CODE_PRESENT** (prior closure YES) |
| Graph eligibility after accept/edit; invalidate on revoke | **CODE_PRESENT** (#527 GRAPH-004) |
| Trade completeness missing-evidence → INSUFFICIENT_EVIDENCE | **CODE_PRESENT** (RULE-015) |
| Fresh live analyze-image (staging smoke) | **PASS / GO** (2026-11-25) |
| Full Worker→persist→retry→human review→device chain | **PARTIAL** — gate proves live provider; durable job/review E2E + video timecode still open |

**Do not rebuild** persist/review/job paths. Next slice: recorded media analysis job → persist → review on staging, then device receipts.

## Code map

| Path | Role |
|---|---|
| `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts` | Vision job handler |
| `apps/web/lib/platform/jobs/job.handlers/persist-report-media-analysis.ts` | `persistReportMediaAnalysis` / `findExistingReportMediaAnalysis` |
| `apps/web/lib/domain/ai-analysis/review.service.ts` | Review + correction insert + graphEligible |
| `apps/web/lib/domain/vision-jobs/*` | Async job identity / lifecycle / request_key |
| `apps/web/supabase/migrations/20261028210000_ais_correction_009_analysis_corrections.sql` | Correction table |
| Prior closure | `docs/reports/ais-correction-009-provenance-2026-10-28/RESULT.md` |

## Unit evidence (local, 2026-11-25)

```bash
cd apps/web && bunx vitest run \
  lib/platform/jobs/job.handlers/persist-report-media-analysis.test.ts \
  lib/platform/jobs/job.handlers/ai-analyze-media.test.ts \
  lib/domain/ai-analysis/review.service.test.ts \
  lib/domain/ai-analysis/review-status.test.ts \
  lib/domain/vision-jobs/create-vision-job.service.test.ts \
  lib/domain/vision-jobs/vision-job-lifecycle.test.ts \
  lib/domain/construction-rules/evaluate-trade-completeness.test.ts
```

**Result:** 7 files, **50 tests PASS**.

## Staging live gate command (reproducible)

```bash
# load SMOKE_EMAIL/SMOKE_PASSWORD + NEXT_PUBLIC_SUPABASE_* (never commit)
export BASE_URL=https://staging.aistroyka.ai
bash scripts/smoke/ai_live_provider.sh --require-live
```

Observed JSON: `live_provider_call_succeeded=true`, `llm_success_count=1`, `fallback_count=0`, `error_kind=null`.

## Explicit non-claims

- Staging analyze-image GO is not full LEVEL 4 product certification.
- Not video segment/timecode → observation end-to-end.
- Not independent specialist holdout metrics.
