# Evidence Matrix (2026-06-28)

| Criterion | Evidence source PR | Evidence result | Limitations | Claim allowed |
|-----------|--------------------|-----------------|-------------|---------------|
| iOS simulator build | PR #146 | PASS (Manager + Worker simulator build) | Simulator, ad-hoc signing; no archive/device | YES |
| iOS login-surface UITest smoke | PR #146 | PASS (`*SmokeUITests` login surface) | Login-surface only | YES |
| iOS Layer B staging E2E | PR #154 | PASS 3/3 (Manager intelligence/copilot, Manager reports inbox, Worker report draft) | Staging target; local simulator run; ad-hoc signing | YES |
| Android debug assemble | PR #148 | PASS (`:AiStroykaWorker` + `:AiStroykaManager` assembleDebug) | Debug only; no release signing | YES |
| Android shared/unit tests | PR #148 | PASS (`SubmitReportBodyTest` 4/4; Manager/Worker unit NO-SOURCE) | Shared lib only | YES |
| Android Worker instrumented launch | PR #148 | PASS 1/1 (`WorkerAppLaunchInstrumentedTest`) on Pilot_ARM64_API34 | Launch smoke only | YES |
| Android Manager instrumented launch | PR #155 | PASS 1/1 (`ManagerAppLaunchInstrumentedTest.activityStarts_andComposeRootExists`) on Pilot_ARM64_API34 | Launch smoke only; no network/credentials/mutation | YES |
| API compatibility after PR #109 | `issue-112-mobile-fresh-audit-2026-06-26` + `MOBILE_PILOT_READINESS.md` | PASS — no breaking `/api/v1` mismatch at source; lite allow-list + 409 `serverCursor` documented | Source-level; live API env confirmation still recommended pre-pilot | YES (source-level) |
| Manager/Worker separation preserved | `MOBILE_PILOT_READINESS.md` | PASS — separate iOS targets + Android modules; shared logic in Shared | — | YES |
| TestFlight / App Store distribution | — | NO evidence | No archive/export/upload; explicitly gated behind build/runtime checks per issue text | NO |
| Google Play distribution | — | NO evidence | No release signing / AAB / Play upload | NO |
| pilot-live evidence | — | NO evidence | Not in issue #112 audit scope | NO |
| production GA evidence | — | NO evidence | Out of scope | NO |

## Summary

- **All build/runtime audit criteria of issue #112: SATISFIED** (iOS simulator + Layer B E2E; Android debug assemble + shared tests + Worker & Manager instrumented launch; API compatibility source-level; Manager/Worker separation).
- **Store/distribution + pilot-live + production GA: NO evidence** — and explicitly **out of the issue #112 audit scope** (gated behind build/runtime checks).
