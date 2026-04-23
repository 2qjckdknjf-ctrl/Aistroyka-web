# STAGE 1 — Android Worker post-audit

## A. ANDROID WORKER TRUTH

**Implemented:**

- Supabase password-issued JWT session persisted in encrypted preferences; same grant type as iOS.
- `GET /api/v1/config` + `GET /api/v1/projects` + `GET /api/v1/worker/tasks/today` for bootstrap and optional task binding.
- `POST /api/v1/worker/report/create` → draft report id.
- Photo: Android Photo Picker → JPEG compress → `POST /api/v1/media/upload-sessions` (`report_before`) → Supabase Storage `POST …/storage/v1/object/media/{path}` → `POST …/media/upload-sessions/:id/finalize` → `POST /api/v1/worker/report/add-media` → `POST /api/v1/worker/report/submit`.
- Compose UI: login, home (project + optional task), report screen with status text and submit success path.

**Still missing (acceptable for STAGE 1 scope):**

- Offline queue, `/api/v1/worker/sync` bootstrap, background retries (iOS has richer op queue).
- Push / `devices/register`.
- Manager app product surface (explicit non-goal).

**Assumptions avoided:**

- No new HTTP routes; headers and bodies match iOS `WorkerAPI` / `UploadManager` and `packages/contracts` worker + upload schemas.
- Video and in-report text comment not implemented without dedicated contract proof (see B).

---

## B. CONTRACT ALIGNMENT

| Area | Alignment |
|------|-----------|
| **auth** | Supabase `auth/v1/token?grant_type=password` + `apikey` header; JWT on `/api/v1` as `Authorization: Bearer`. |
| **report create** | `POST /api/v1/worker/report/create` with optional `day_id` / `task_id`; idempotency key. |
| **photo attach** | `upload_session_id` on `add-media`; purpose `report_before` for session create. |
| **upload/finalize** | Storage path math matches iOS (`media/` prefix, `object_path` for finalize). |
| **submit** | `POST /api/v1/worker/report/submit` with `report_id` and optional `task_id`. |

**Fields / features intentionally not implemented (insufficient truth for STAGE 1):**

- **Video** uploads — not wired; would need confirmed worker media contract and storage MIME/path rules beyond photo JPEG path.
- **Worker text comment** on report — no dedicated route in this contour; **P1** if product requires it.

---

## C. VALIDATION

**Builds run:**

- `./gradlew :AiStroykaWorker:assembleDebug`
- `./gradlew :AiStroykaManager:assembleDebug` (sanity after shared/Gradle edits)

**Checks run:**

- Kotlin compile for `:shared` and `:AiStroykaWorker` (via assemble).
- `:AiStroykaWorker:lintDebug` — **not clean** on AGP 7.4 + Kotlin 1.9 (metadata mismatch in Lint worker); see `STAGE1_ANDROID_WORKER_VALIDATION.md`.

**Failures found:**

- Initial host had **JDK 14**; **AGP 8.x** required JDK 17 → **fixed** by moving toolchain to **Gradle 7.6.3 + AGP 7.4.2** so assemble works on JDK 11–14.
- **KDoc** in `ApiClient` accidentally contained `*/` inside `/api/v1/*` → **fixed** (comment terminator).
- **Public inline** `ApiClient.request` accessed private members → **fixed** (`internal` + `internal` members).
- **Manager** `MainActivity` had unused `Preview` import without `ui-tooling-preview` → **fixed** (removed dead imports).

**Final validation status:** **Worker `assembleDebug` PASS**; **Android Lint** deferred to JDK 17 / AGP 8 matrix.

---

## D. STAGE 1 DECISION

| Question | Answer |
|----------|--------|
| **STAGE 1 closed** | **YES** |
| **Remaining P0** | None for the defined contour, once `SUPABASE_*` and `BASE_URL` are set for a real tenant. |
| **Remaining P1** | Full `lintDebug` on AGP 8; offline/sync parity with iOS; video/comment if product demands. |
| **Is STAGE 2 allowed** | **YES** (per program plan — do not start until product authorizes). |
| **Why** | Android Worker is no longer a stub; report + photo + upload + submit exists against existing APIs; assemble passes. |

---

## E. FILES

**Docs created/updated:**

- `docs/launch/STAGE1_ANDROID_WORKER_RESCUE.md`
- `docs/launch/STAGE1_ANDROID_WORKER_VALIDATION.md`
- `docs/launch/STAGE1_ANDROID_WORKER_POST_AUDIT.md` (this file)

**Android code areas changed:**

- `android/shared/**` — new networking, auth, `WorkerApi`, DTOs; removed obsolete `Config.kt`.
- `android/AiStroykaWorker/**` — `WorkerApplication`, `WorkerViewModel`, `WorkerApp`, `MainActivity` unchanged entry, `build.gradle.kts`, `AndroidManifest.xml`.
- `android/build.gradle.kts`, `android/gradle/wrapper/gradle-wrapper.properties`, `android/gradle.properties` — toolchain.
- `android/AiStroykaManager/build.gradle.kts` — `packagingOptions` + Java 11; `MainActivity.kt` — unused imports removed.

**Backend/shared areas changed:** **None** (Next.js routes and contracts unchanged).
