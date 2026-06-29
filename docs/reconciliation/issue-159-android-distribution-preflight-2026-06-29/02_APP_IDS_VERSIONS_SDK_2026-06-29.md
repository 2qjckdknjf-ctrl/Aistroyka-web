# Application IDs, Versions, SDK

Source: `android/AiStroykaManager/build.gradle.kts`, `android/AiStroykaWorker/build.gradle.kts`.

## AiStroykaManager

| Field | Value |
| --- | --- |
| `namespace` | `ai.aistroyka.manager` |
| `applicationId` | `ai.aistroyka.manager` |
| `versionCode` | `1` |
| `versionName` | `1.0.0` |
| `minSdk` | `26` |
| `targetSdk` | `34` |
| `compileSdk` | `34` |

## AiStroykaWorker

| Field | Value |
| --- | --- |
| `namespace` | `ai.aistroyka.worker` |
| `applicationId` | `ai.aistroyka.worker` |
| `versionCode` | `1` |
| `versionName` | `1.0.0` |
| `minSdk` | `26` |
| `targetSdk` | `34` |
| `compileSdk` | `34` |

## Blocker analysis

| Check | Status | Notes |
| --- | --- | --- |
| `applicationId` present | OK | distinct per app |
| `applicationId` duplicated | OK | Manager and Worker differ |
| `versionCode` valid | OK | `1` for both (first upload) |
| `versionCode` increment-ready | **BLOCKER (manual)** | hard-coded `1`, no auto-increment; **build number bump required per upload** |
| `targetSdk` meets Play requirement | **BLOCKER** | both target API **34**. Google Play's target API requirement is **API 35 (Android 15)** for new app submissions and updates as of 2025-08-31. Target API 34 is below the current Play bar for new submissions in 2026 → must bump `targetSdk`/`compileSdk` to 35 before upload. |
| `minSdk` | OK | API 26 is broadly acceptable |

> The `targetSdk = 34` finding is the single most likely hard rejection at upload
> time and should be resolved by the owner in a dedicated code PR (not in this
> docs-only preflight).
