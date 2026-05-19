# Mobile release readiness

**Date:** 2026-05-19  
**Verdict:** **NOT READY**

## iOS

| Item | Status |
|------|--------|
| Bundle IDs | Verify in Xcode (`AiStroykaWorker` / `AiStroykaManager` targets). |
| Debug build | **PASS** (simulator). |
| Release / archive | **Not run** (signing unknown). |
| App icons / launch screen | Present per projects (not re-audited pixel-perfect). |
| Info.plist permission copy | **Verify** before TestFlight. |

## Android

| Item | Status |
|------|--------|
| applicationId | `ai.aistroyka.worker` / manager module equivalent. |
| versionCode / versionName | Worker `1` / `1.0.0` — bump policy TBD. |
| Release build | **PASS** — `:AiStroykaWorker:assembleRelease` and `:AiStroykaManager:assembleRelease` succeeded. |
| Release signing | **Document only** — no keystore in repo (correct), signing for store delivery still external. |
| Play checklist | **Open** |

## Notes from latest run

- Initial release attempt failed with `Java heap space` during dex/resource merge.
- Added Gradle JVM tuning in `android/gradle.properties`:
  - `org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8`
  - `kotlin.daemon.jvm.options=-Xmx2g`
- After tuning, Android release assembly succeeded for both apps.
