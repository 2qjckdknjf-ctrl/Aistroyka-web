# Claims allowed / disallowed (2026-06-26)

Based on evidence collected at SHA `bc992b72598c615c4fc57f7591cd7e0ed57fb0f`.

## Native evidence summary

| Gate | Result | Notes |
|------|--------|-------|
| Android debug assemble (Manager + Worker) | **PASS** | Debug APKs produced |
| Android shared unit tests | **PASS** | 4 tests in `SubmitReportBodyTest` |
| Android instrumented launch (Worker) | **PASS** | 1 smoke test — Compose root mount only |
| Release signing | **NOT USED** | Debug keystore only |
| Google Play upload | **NOT PERFORMED** | — |

## Claims explicitly allowed

- On this SHA, with recorded toolchain, **Android debug assemble succeeded** for Manager + Worker.
- On this SHA, **shared unit tests passed** (4/4).
- On this SHA, on emulator `Pilot_ARM64_API34`, **Worker login-surface instrumented launch smoke passed** (`activityStarts_andComposeRootExists` — activity starts and Compose root exists).

## Claims explicitly NOT allowed

| Claim | Allowed |
|-------|---------|
| Full Android readiness | **NO** — launch smoke only; no Manager instrumented tests; no live E2E; no release build |
| Full mobile readiness | **NO** — iOS Layer B live E2E still outstanding |
| Google Play / store readiness | **NO** — no release bundle, signing, or upload |
| Pilot-live | **NO** — no pilot deployment evidence |
| Production GA | **NO** |
| Latest `main` deployed to web production | **NO** — requires `buildStamp` / deployment evidence |

## Limitations

- Instrumented test checks **activity + Compose root mount only** — not login, sync, submit, or pilot flows.
- Manager app has **no instrumented test** on this SHA.
- Evidence is **local operator run**, not a recorded CI workflow run URL for this slice.
- Debug build uses default debug signing — not a release/store artifact.
