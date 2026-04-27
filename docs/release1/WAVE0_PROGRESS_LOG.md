# Wave 0 — Progress log (append-only)

---

## 2026-03-26 — Session start

- Read `PHASE1_*` scope docs.
- Ran `xcodebuild -list` for Worker + Manager projects.
- Ran `./gradlew projects` for Android.

## 2026-03-26 — iOS builds

- **Failed:** `-destination 'platform=iOS Simulator,name=iPhone 16'` without `-sdk iphonesimulator` → built for **iphoneos**, failed signing (no provisioning profile for `ai.aistroyka.worker`).
- **Succeeded:** `-sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO` for both apps → **BUILD SUCCEEDED**.
- Added `scripts/ios/build-simulator.sh`; `chmod +x`; re-ran → **OK**.

## 2026-03-26 — Android builds

- `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` → **BUILD SUCCESSFUL**.
- Glob `android/**/test/**/*.kt` → **0** files.

## 2026-03-26 — CI

- Confirmed **no** `ci.yml` at repo root before Wave 0; nested `apps/web/.github/workflows/ci.yml` exists.
- **Added** `.github/workflows/ci.yml` at root (duplicate of nested content + comment).

## 2026-03-26 — Auth matrix

- Read `lite-allow-list.ts`, `admin/layout.tsx`, `(dashboard)/layout.tsx`, `ManagerRootView.swift` (ios_manager).

## 2026-03-26 — G9

- Grepped ios/android for video/voice/earnings; read `FIRST_CLIENT_SCOPE_LOCK.md` table.

## 2026-03-26 — Deliverables

- Wrote: `WAVE0_BUILD_TRUTH.md`, `WAVE0_CI_DECISION.md`, `WAVE0_AUTH_TENANT_MATRIX.md`, `WAVE0_G9_DECISION_INPUT.md`, `WAVE0_GATE_RESULTS.md`, this log.

## Assumptions

- GitHub Actions will pick up **new** root `ci.yml` on next push.
- Simulator-only iOS build is sufficient for **G0** “reproducible build truth” until device distribution is required.

## Unresolved

- Whether **nested** `apps/web/.github/workflows/deploy.yml` still runs and could **double** deploy.
- **Physical device** iOS signing for TestFlight — not in Wave 0.

---

*Append only below this line.*
