# Android Rebuild Architecture

**Date:** 2026-03-12  
**Project:** AISTROYKA — four separate mobile apps

---

## 1. Target layout

```
android/
  build.gradle.kts
  settings.gradle.kts
  gradle.properties
  gradle/wrapper/
  AiStroykaManager/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/ai/aistroyka/manager/
        MainActivity.kt
        ui/ManagerApp.kt
      res/values/
        strings.xml
        themes.xml
  AiStroykaWorker/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/ai/aistroyka/worker/
        MainActivity.kt
        ui/WorkerApp.kt
      res/values/
        strings.xml
        themes.xml
  shared/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/ai/aistroyka/shared/
        Config.kt
  README.md
```

- **Two application modules** (AiStroykaManager, AiStroykaWorker) and **one library module** (shared).
- **Kotlin**, **Jetpack Compose**, **Clean Architecture + MVVM** (to be applied as features are added). **Hilt**, **Retrofit/Ktor**, **Coroutines + Flow** to be added for DI and networking.

---

## 2. Naming and identifiers

| App              | applicationId           | namespace               | App name (string)   |
|------------------|-------------------------|-------------------------|----------------------|
| AiStroykaManager | ai.aistroyka.manager    | ai.aistroyka.manager    | AiStroyka Manager    |
| AiStroykaWorker  | ai.aistroyka.worker     | ai.aistroyka.worker     | AiStroyka Worker     |

---

## 3. Tech stack (target)

- **Language:** Kotlin.
- **UI:** Jetpack Compose (Material3).
- **Architecture:** Clean + MVVM; use cases and repositories as needed.
- **DI:** Hilt (to be added).
- **Networking:** Retrofit or Ktor (to be added).
- **Async:** Coroutines + Flow.
- **Min/target SDK:** 26 / 34.

---

## 4. Shared module

- **Purpose:** Auth, API client, DTOs, config, device context.
- **Consumption:** Both app modules `implementation(project(":shared"))`.
- **Bootstrap:** `Config.kt` with default API base URL. Extend with auth, API interfaces, and DTOs aligned with `shared/contracts` and `packages/contracts`.

---

## 5. Openability

- Open the **android** folder in Android Studio. Sync Gradle; run either **AiStroykaManager** or **AiStroykaWorker** configuration.
- If Gradle wrapper is missing, run `gradle wrapper` from repo root or let Android Studio create it.

---

## 6. No WorkerLite / no mixing

- App names are **AiStroykaManager** and **AiStroykaWorker** only.
- No single app combining manager and worker roles; no legacy WorkerLite naming in module or app names.
