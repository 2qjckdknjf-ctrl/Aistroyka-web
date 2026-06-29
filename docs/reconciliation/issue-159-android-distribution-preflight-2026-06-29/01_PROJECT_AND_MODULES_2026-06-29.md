# Android Project & Modules

## Toolchain

| Item | Value | Source |
| --- | --- | --- |
| Android Gradle Plugin (AGP) | `8.2.2` | `android/build.gradle.kts` |
| Kotlin | `1.9.20` | `android/build.gradle.kts` |
| Kotlin serialization plugin | `1.9.20` (applied false at root) | `android/build.gradle.kts` |
| Google Services plugin | `4.4.2` (applied false at root, applied in Worker) | `android/build.gradle.kts` |
| JDK used for preflight | JBR 17.0.14 (arm64) | local `JAVA_HOME` |
| `compileSdk` | 34 | both app modules |
| Compose | enabled (BOM `2023.10.01`, compiler ext `1.5.5`) | both app modules |

## Modules (`android/settings.gradle.kts`)

- `:AiStroykaManager` — `com.android.application`
- `:AiStroykaWorker` — `com.android.application` (+ `com.google.gms.google-services`)
- `:shared` — shared library module

Root project name: `AiStroyka`.

## Release tasks available

Both application modules expose the standard release tasks:

- `:AiStroykaManager:assembleRelease`, `:AiStroykaManager:bundleRelease`
- `:AiStroykaWorker:assembleRelease`, `:AiStroykaWorker:bundleRelease`

## Play / publishing tooling

| Tooling | Present | Notes |
| --- | --- | --- |
| Gradle Play Publisher plugin (`com.github.triplet.play`) | **NO** | not configured in any module |
| `fastlane` / `supply` | **NO** | no `android/fastlane` dir |
| Play metadata tree | **NO** | no `metadata/android` tree |
| Play service account JSON | **NO** (not in repo) | not verifiable locally |
| Firebase `google-services.json` (Worker) | **YES** | tracked at `android/AiStroykaWorker/google-services.json` (pre-existing FCM config on `main`; not modified here) |

There is **no automated Google Play publishing pipeline** in the repo. Any upload
would currently be a manual Play Console action by the owner.
