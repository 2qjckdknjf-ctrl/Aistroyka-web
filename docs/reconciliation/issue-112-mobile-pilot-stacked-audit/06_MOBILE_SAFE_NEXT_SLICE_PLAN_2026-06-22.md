# Mobile Safe Next Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Small PR

After PR #109 merges and `main` is validated, the next safest mobile work is:

**iOS post-baseline runtime validation PR/runbook update.**

This should be validation-first, not feature implementation.

## Proposed Scope

- Rerun iOS UI smoke on the merged baseline.
- Rerun iOS Layer B API chain and live UITests using approved smoke credentials.
- Confirm Manager report review uses a real tenant owner/admin or explicit project manager role.
- Confirm Worker report create/submit and own-report read still work after PR #109.
- Record evidence in docs without secrets.
- If a small fix is needed, create a separate focused fix PR after documenting failure.

## Expected Files for Validation-Only PR

Likely docs-only paths:

- `docs/mobile-ios/IOS_E2E_VALIDATION_REPORT.md`
- `docs/mobile-ios/IOS_FINAL_MOBILE_READINESS_VERDICT.md`
- `docs/mobile-ios/manual-smoke/*.md`
- optional `docs/runbooks/MOBILE_SYNC.md` or `MOBILE_UPLOADS.md` if evidence changes assumptions

No iOS/Android source changes should be included unless a real validation failure requires a separate fix.

## Required Tests / Commands

Recommended sequence after PR #109 merge:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bun run build:contracts`
- `bun run i18n:check`
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`
- `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh`
- `bash scripts/smoke/ios_mobile_api_chain.sh`
- `bash ios/scripts/run-ios-e2e-integration-local.sh`

Only run live/pilot commands with approved smoke credentials and no secret printing.

## Deferred

Remain deferred:

- Broad `release/mobile-pilot-rc` merge.
- Android design system / launch branch merge.
- TestFlight upload.
- Google Play upload.
- Android parity expansion.
- Mobile AI feedback or Liquid Glass work.
- Any web/API change unless a focused compatibility failure is proven.

## Explicit No Broad Merge Rule

Broad mobile merge safe: NO.

Reason: the mobile branches combine Android, iOS, web API, middleware, docs, design, and release claims. Future work must be tiny, evidence-driven, and based on merged PR #109.

## Slice Verdict

Next safe slice: iOS post-baseline runtime validation and evidence update.

Safe before PR #109 merges: NO.
