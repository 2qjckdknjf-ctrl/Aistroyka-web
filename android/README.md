# Android — AiStroyka Manager & Worker

Two app modules and a shared library.

**First-pilot status:** Android remains a **buildable engineering foundation** and is **deferred** from the first pilot (web + iOS). Do not claim pilot readiness, live FCM, offline-first parity, or Google Play availability from Debug builds alone. See `docs/mobile/P3_ANDROID_DEFER_DECISION.md` and Phase 6 closure.

- **AiStroykaManager** — `:AiStroykaManager` — Manager Compose scaffold (login, reports inbox, review). Thinner than iOS Manager.
- **AiStroykaWorker** — `:AiStroykaWorker` — Worker Compose scaffold (tasks, report, photo, manual sync). No durable offline queue parity with iOS.
- **shared** — `:shared` — Shared Kotlin/Android code (config, API client, DTOs, brand tokens).

Client profiles: Worker `android_worker` (lite allow-list); Manager `android_manager`.

Open the `android` folder in Android Studio. If Gradle wrapper is missing, run `gradle wrapper` from the project root or let Android Studio sync and download it.

Required deferred-track build:

```bash
JAVA_HOME=/path/to/jdk-17 ./gradlew :shared:test :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
```
