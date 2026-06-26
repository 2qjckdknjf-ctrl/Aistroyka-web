# Validation Reality (2026-06-26)

## What CAN be validated in this environment
- **Web/monorepo suite** from repo root: `bun install --frozen-lockfile`, `bun run lint`, `bun run build:contracts`, `bun run i18n:check`, `I18N_CHECK_ALL=1 bun run i18n:check`, `bun run test -- --run`, `bun run build`, `bun run cf:build`. Baseline **1546/1546** tests.
- **Static/source inspection** of `ios/**` and `android/**` (file presence, structure, API/DTO alignment, test-target presence).
- **Script presence** review: `ios/scripts/*`, `scripts/ios/build-simulator.sh`, `scripts/android/verify-worker-release-no-photo-bypass.sh`, `scripts/mobile/smoke-mobile.sh`, `scripts/mobile/smoke-push.sh`.

## What CANNOT be claimed without additional toolchains/evidence
- **iOS build / UITest smoke:** requires **macOS + Xcode + iOS Simulator**. Locally via `ios/scripts/run-ios-uitest-smoke-local.sh`; in CI via `.github/workflows/ios-ui-smoke.yml` (runs on `ios/**` non-markdown changes, or `workflow_dispatch`). Not run by this docs-only audit.
- **iOS Layer B live pilot E2E:** requires `ios/Config/Secrets.xcconfig` + gitignored `.uitest-e2e-credentials` + production Supabase/`PILOT_E2E_*` secrets (`.github/workflows/ios-e2e-integration.yml`, `workflow_dispatch`). Not run here.
- **Android assemble/bundle + instrumented tests:** require **Android SDK / Gradle / emulator or device**. Not run here.
- **TestFlight / App Store / Google Play status:** **no evidence** — must not be claimed.
- **Deployed SHA:** latest `main` is **not** assumed deployed; confirm only via deployment run and/or `GET /api/v1/health` `buildStamp.sha7` per `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md`. No production GA claim.

## Required validation BEFORE any mobile pilot/deploy claim
1. iOS Manager + Worker build green; `*SmokeUITests` pass on simulator (CI or local).
2. iOS Layer B E2E green against production with gitignored pilot credentials (no secrets committed).
3. Android Manager + Worker assemble/bundle green; `shared` unit tests + Worker instrumented launch pass; no-photo-bypass guard green.
4. Mobile API compatibility against `/api/v1` (lite allow-list paths for `ios_lite`/`android_lite`; 409 `serverCursor` reconciliation per `docs/runbooks/MOBILE_SYNC.md`).
5. Login/session smoke for Manager and Worker; no Manager/Worker product merge; no WorkerLite naming regression.
6. Deployment/buildStamp evidence captured before any "pilot live" statement.
