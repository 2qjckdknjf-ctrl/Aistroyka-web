# STAGE 1 — Android Worker rescue

## Mission

Replace the AiStroyka Worker Android stub with a **minimal, launch-capable** contour aligned to existing backend and iOS Worker truth:

**login → bootstrap (config + projects + tasks) → create report → pick photo → upload session → Supabase storage POST → finalize → add-media → submit → success UI.**

No new backend APIs. No Android Manager feature work beyond what shared/Gradle required.

## Repo-backed contracts

| Step | Method | Route | Notes |
|------|--------|-------|--------|
| Auth | POST | `{SUPABASE_URL}/auth/v1/token?grant_type=password` | Same as iOS `AuthService` |
| Bootstrap | GET | `/api/v1/config` | Flags + serverTime + clientProfile |
| Projects | GET | `/api/v1/projects` | Task / report context |
| Tasks | GET | `/api/v1/worker/tasks/today?project_id=` | Optional task link |
| Create report | POST | `/api/v1/worker/report/create` | `day_id` / `task_id` optional; idempotency |
| Upload session | POST | `/api/v1/media/upload-sessions` | `purpose`: `report_before` (matches iOS queue) |
| Storage upload | POST | `{SUPABASE_URL}/storage/v1/object/media/{path}` | Same path math as iOS `UploadManager` |
| Finalize | POST | `/api/v1/media/upload-sessions/:id/finalize` | `object_path`, `mime_type`, `size_bytes` |
| Add media | POST | `/api/v1/worker/report/add-media` | `report_id` + `upload_session_id` |
| Submit | POST | `/api/v1/worker/report/submit` | `report_id` + optional `task_id` |

**Client headers (all API v1 calls):** `Authorization: Bearer`, `x-device-id`, `x-client: android_lite`, `x-idempotency-key` on writes.

## Implementation map

- **`android/shared`**: `AppRuntime`, `DeviceContext`, `SessionStore` (encrypted prefs), `AuthService`, `ApiClient`, `WorkerApi`, DTOs (`WorkerDtos.kt`).
- **`android/AiStroykaWorker`**: `WorkerApplication` (init runtime + session), `WorkerViewModel` (flow + JPEG pipeline), `WorkerApp` (Compose UI), `BuildConfig` for `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

## Configuration

Set `buildConfigField` values in `AiStroykaWorker/build.gradle.kts` to match web `NEXT_PUBLIC_APP_URL` (origin only, no `/api/v1`) and Supabase keys from `docs/ENVIRONMENT-VARIABLES.md` / `.env.example` (same as iOS `Secrets.xcconfig`).

Default `BASE_URL` is `https://aistroyka.ai`; Supabase fields default empty until set.

## Explicitly out of scope (STAGE 1)

- **Worker `/api/v1/worker/sync`**, offline queue, background upload service — not required for minimal contour (iOS has them; Android can add in a later stage).
- **Video** and **text comment** on reports — no proof in contracts used here; **OPEN / P1** until a route + domain path is confirmed in repo.
- **Devices/register** (push) — not on critical path for first-client report flow.

## Gradle / toolchain note

The repo was moved to **Android Gradle Plugin 7.4.2** and **Gradle 7.6.3** so `assembleDebug` runs on **JDK 11–14** hosts. **JDK 17 + AGP 8.x** is recommended for production and full Android Lint (see validation doc).
