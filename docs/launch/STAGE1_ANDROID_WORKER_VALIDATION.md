# STAGE 1 — Android Worker validation

## Environment

- **OS:** darwin (per agent)
- **JDK:** 14 (`/Library/Java/JavaVirtualMachines/jdk-14.0.1.jdk`)
- **Android:** Gradle **7.6.3**, AGP **7.4.2**, Kotlin **1.9.20**

AGP 8.x was not usable here because it requires JDK 17; the project was downgraded for this host so Worker **assembleDebug** is a real gate.

## Commands run

```bash
cd android
./gradlew :AiStroykaWorker:assembleDebug :shared:compileDebugKotlin
./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
```

## Results

| Check | Result |
|--------|--------|
| `:AiStroykaWorker:assembleDebug` | **PASS** |
| `:shared:compileDebugKotlin` | **PASS** (via Worker assemble) |
| `:AiStroykaManager:assembleDebug` | **PASS** (minimal fix: removed broken unused `Preview` import in `MainActivity.kt`) |

## Android Lint

`:AiStroykaWorker:lintDebug` was attempted together with Manager assemble; **failed** inside the Lint task with:

`Module was compiled with an incompatible version of Kotlin. The binary version of its metadata is 1.9.0, expected version is 1.7.1.`

This is a known **AGP 7.4 Lint analyzer vs Kotlin 1.9** mismatch. **Mitigation:** use **JDK 17 + AGP 8.2+** and re-run `lintDebug`, or rely on `assembleDebug` + CI on JDK 17+.

## Web / API automated tests

Not re-run as part of STAGE 1 (no backend edits). Worker flow uses existing Next.js routes under `apps/web/app/api/v1/`.

## Manual smoke (operator)

After setting `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `BASE_URL` in Worker `buildConfigField`:

1. Install debug APK, sign in with a real tenant worker user.
2. Confirm config + projects load.
3. Create report → pick photo → wait for “Photo attached” → Submit → “Report submitted successfully.”
