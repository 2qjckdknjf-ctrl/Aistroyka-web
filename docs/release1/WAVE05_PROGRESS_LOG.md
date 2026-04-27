# Wave 0.5 — Progress log (append-only)

---

## 2026-03-26

### Inspections

- Read Android `build.gradle.kts`, `WorkerViewModel.submitReport`, `WorkerApp` submit `enabled`.
- Inspected generated `BuildConfig.java` for **release** and **debug** (local `android/.../build/`).
- Read `lite-allow-list.ts` + `lite-allow-list.test.ts`, `requireAdmin.ts`.

### Commands

- `./gradlew :AiStroykaWorker:assembleRelease` — **OK**
- `./gradlew -PpilotRealSubmit=true :AiStroykaWorker:generateDebugBuildConfig` — **PILOT false**
- `./gradlew :AiStroykaWorker:generateDebugBuildConfig` — restored default; **PILOT true**
- Attempted `npm`/`bun`/`vitest` — **node not on PATH** in agent shell — tests **not run**
- `chmod +x` + ran `scripts/android/verify-worker-release-no-photo-bypass.sh` — **OK**

### Minimal fixes

- Added `scripts/android/verify-worker-release-no-photo-bypass.sh`.

### Assumptions

- Generated `BuildConfig.java` under `android/AiStroykaWorker/build/` may contain secrets from `local.properties` — **never commit** `build/` artifacts to VCS.

### Docs written

- `WAVE05_ANDROID_NON_BYPASS_TRUTH.md`
- `WAVE05_AUTH_TENANT_RUNTIME_PROOF.md`
- `WAVE05_G9_FINAL_DECISION_PACKAGE.md`
- `WAVE05_MINIMUM_PROOF_BASELINE.md`
- `WAVE05_GATE_UPDATE.md`
- `WAVE05_PROGRESS_LOG.md` (this file)

### Unresolved

- Vitest + pilot smoke execution on CI or dev machine (operator).
- Leadership sign-off on G9 draft.

---

*Append below only.*
