# Signed archive / export

## This run

Signed archive and export were **SKIPPED** because prerequisites were not satisfied:

- `APPROVE_TESTFLIGHT_UPLOAD=YES` not set
- `AISTROYKA_IOS_BUILD_NUMBER` missing
- No Apple Distribution certificate in keychain
- No App Store provisioning profiles for `ai.aistroyka.manager` or `ai.aistroyka.worker`
- No `ExportOptions.plist` present in repo

## Prior evidence (PR #161)

- Manager no-sign archive: **PASS** (ARCHIVE SUCCEEDED)
- Worker no-sign archive: **PASS** (ARCHIVE SUCCEEDED)
- This establishes no-sign archive readiness only; it does not satisfy signed export or TestFlight upload gates.

## Results (this run)

| App | Archive | Export |
|-----|---------|--------|
| Manager (AiStroykaManager) | SKIPPED | SKIPPED |
| Worker (AiStroykaWorker) | SKIPPED | SKIPPED |

- Build number used: N/A
- Artifacts local only: N/A (no archive/export attempted)
- Artifacts committed: **NO**

## Blocker

Cannot produce signed archives/exports without Apple Distribution certificate, App Store provisioning
profiles for both bundle IDs, confirmed build number, and verified export options.
