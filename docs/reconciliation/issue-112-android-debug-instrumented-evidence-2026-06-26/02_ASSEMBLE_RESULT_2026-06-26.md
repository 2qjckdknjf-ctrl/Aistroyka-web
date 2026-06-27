# Assemble result — Android debug (2026-06-26)

## Command

```bash
cd android
./gradlew assembleDebug --stacktrace
```

## Modules / tasks

- `:shared:assembleDebug`
- `:AiStroykaManager:assembleDebug`
- `:AiStroykaWorker:assembleDebug`

Equivalent explicit tasks per evidence plan: `:AiStroykaWorker:assembleDebug` + `:AiStroykaManager:assembleDebug`.

## Result

**PASS**

- Gradle exit code: `0`
- Build time: ~25s
- Summary: `BUILD SUCCESSFUL in 25s` — 100 actionable tasks, 100 executed

## Log

Local operator log (not committed — too large):

`evidence/android-debug-instrumented-2026-06-26/logs/android-assemble-debug.log`

Key excerpt:

```
> Task :AiStroykaWorker:assembleDebug
> Task :AiStroykaManager:assembleDebug
BUILD SUCCESSFUL in 25s
100 actionable tasks: 100 executed
```

## APK artifacts

| Module | Path |
|--------|------|
| Worker | `android/AiStroykaWorker/build/outputs/apk/debug/AiStroykaWorker-debug.apk` |
| Manager | `android/AiStroykaManager/build/outputs/apk/debug/AiStroykaManager-debug.apk` |

APK binaries are build artifacts (gitignored under `android/**/build/`); paths recorded here only.

## Signing

Debug signing only (Gradle `validateSigningDebug` — default debug keystore). **No release signing.**
