# STAGE 15 — Android Scope Lock / Deferred Product Policy

## 1. Goal

Truthfully classify Android readiness and lock release scope to prevent false publication claims.

## 2. Inspection summary

Reviewed:

- `android/settings.gradle.kts`
- `android/AiStroykaWorker/build.gradle.kts`
- `android/AiStroykaManager/build.gradle.kts`
- `android/AiStroykaWorker/src/main/AndroidManifest.xml`
- `android/AiStroykaManager/src/main/AndroidManifest.xml`
- Worker and Manager app/view-model surfaces under `android/AiStroykaWorker/src/main/java` and `android/AiStroykaManager/src/main/java`

Findings:

1. Separate Worker/Manager Android modules exist and compile.
2. Both apps are configured with real API/Supabase build-config wiring (via env/gradle/local properties), not static mock screens only.
3. Worker flow code includes login, shift start/end, report create, media upload pipeline, submit, sync, and device registration hooks.
4. Manager flow code includes login, project/reports list, report detail, and approve/reject/request changes actions.
5. No runtime evidence in this stage proves full end-to-end pilot-level Android behavior on real device/emulator test matrix.

## 3. Validation commands

```bash
cd android
./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
```

Result: **PASS** (BUILD SUCCESSFUL).

Note: AGP warning indicates plugin 7.4.2 vs `compileSdk = 34`; build is successful but stack should be modernized later.

## 4. Classification

- **BUILDABLE_SHELL**

Rationale:

- Buildable and wired to backend contracts.
- Runtime product completeness and operational hardening are not proven for first public release target.

## 5. Scope lock decision

1. Android is **deferred** from first release/publication scope.
2. Android must not be marketed as production-ready.
3. Android remains internal/engineering track until dedicated runtime QA and pilot evidence closes.

## 6. Stage verdict

CLOSED (scope lock completed with truthful classification).

