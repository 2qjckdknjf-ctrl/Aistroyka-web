# Phase 1 Stabilization Report

**Project:** AISTROYKA.AI  
**Phase:** Architecture guardrails stabilization (no new features).  
**Status:** Complete.

---

## Baseline (Stage 0)

### 0.1 Canonical app entry

- **apps/web** is the deployed application: root `package.json` delegates `dev`, `build`, `start`, `cf:build`, `cf:deploy`, `lint` to `apps/web`.
- **Root `/app** (at repository root) is legacy/duplicate: contains`api/`,`(auth)/`,`(dashboard)/`,`smoke/`, but the active app is under`apps/web/app` (with `[locale]`, full API tree). Root`app` was not deleted in this phase per instructions.

### 0.2 Baseline checks (recorded)

| Check | Command | Result |
| ----- | ------- | ------ |
| Install | `cd apps/web && npm ci` | **Failed** — ERESOLVE peer dependency conflict (next vs @opennextjs/cloudflare). |
| Install (fallback) | `cd apps/web && npm install --legacy-peer-deps` | **Passed** |
| Unit tests | `npm test` | **Passed** — 37 test files, 167 tests. |
| Next build | `npm run build` | **Passed** (after minimal build fixes). |
| OpenNext/CF build | `npm run cf:build` | **Passed** |

**Build fixes applied (baseline only, no feature changes):**

- Added `lib/security-headers.js` (CJS shim) so next.config.js can require it (Node does not load .ts in config).
- `app/api/v1/devices/register/route.ts`: type assertion for `device_tokens` upsert (table not in generated Supabase types).
- `lib/platform/ai/providers/index.ts`: explicit exports to avoid duplicate `invokeVision` export.
- `lib/platform/analytics/analytics.service.ts`: added `date` to Map value type in getProductivity.
- `lib/platform/jobs/queue/queue.db.ts`: `jobs as unknown as JobRecord[]` for claim return type.

**Notes:**

- Use `npm install --legacy-peer-deps` for install until peer deps are resolved.
- ESLint reports plugin conflict between apps/web and root .eslintrc; build still completes.

---

## 1. Summary of changes

- **AIService (VisionService):** Single entry point for vision analysis at `lib/platform/ai/ai.service.ts`. All AI flows go through: Policy Engine → Provider Router (circuit breaker/fallback) → usage recording. `analyzeImage(admin, ctx, opts)` returns the same response shape as before. Used by `/api/ai/analyze-image`, `/api/v1/ai/analyze-image` (re-export), and job handlers `ai-analyze-media` and `ai-analyze-report`. No direct OpenAI fetch in routes or handlers.
- **SyncService.bootstrap:** Orchestration and DB access moved into `lib/sync/sync.service.ts` and repositories (`report.repository`, `upload-session.repository`). Route `GET /api/v1/sync/bootstrap` is thin: validate `x-device-id`, context, then `SyncService.bootstrap(supabase, ctx, { deviceId })`. Response shape unchanged.
- **Lite allow-list enforcement:** Middleware + `lib/api/lite-allow-list.ts` enforce allowed paths for `x-client` in `{ ios_lite, android_lite }`. Disallowed paths (e.g. `/api/v1/projects`, `/api/v1/admin/*`, `/api/v1/jobs/process`) return **403** with `{ error: "forbidden", code: "lite_client_path_forbidden" }`. Web and full clients unchanged.
- **Idempotency for lite writes:** For `ios_lite`/`android_lite`, POST (and other write) requests to designated Lite write endpoints **require** `x-idempotency-key`. Missing key → **400** with `code: "idempotency_key_required"`. Duplicate key returns cached response (no duplicate side effects). Wired on: upload-sessions create/finalize, worker day/start and day/end, worker report create/add-media/submit, sync/ack.

---

## 2. Files touched

### New

- `apps/web/lib/platform/ai/ai.service.ts` — AIService entry
- `apps/web/lib/platform/ai/ai.service.test.ts` — AIService tests
- `apps/web/lib/sync/sync.service.ts` — SyncService.bootstrap
- `apps/web/lib/sync/sync.service.test.ts` — bootstrap contract tests
- `apps/web/lib/domain/reports/report.repository.ts` — `listForBootstrap`
- `apps/web/lib/domain/upload-session/upload-session.repository.ts` — `listForBootstrap`
- `apps/web/lib/api/lite-allow-list.ts` — allow-list logic
- `apps/web/lib/api/lite-allow-list.test.ts` — allow-list tests
- `apps/web/lib/api/lite-idempotency.ts` — lite idempotency helpers
- `apps/web/lib/api/lite-idempotency.test.ts` — idempotency tests
- `apps/web/lib/security-headers.js` — CJS shim (baseline)

### Modified

- `apps/web/app/api/ai/analyze-image/route.ts` — thin route, uses AIService
- `apps/web/app/api/v1/ai/analyze-image/route.ts` — re-exports same handler
- `apps/web/app/api/v1/sync/bootstrap/route.ts` — thin, uses SyncService.bootstrap
- `apps/web/app/api/v1/sync/ack/route.ts` — lite idempotency
- `apps/web/middleware.ts` — lite allow-list check for `/api/v1/*`
- `apps/web/app/api/v1/media/upload-sessions/route.ts` — lite idempotency
- `apps/web/app/api/v1/media/upload-sessions/[id]/finalize/route.ts` — lite idempotency
- `apps/web/app/api/v1/worker/day/start/route.ts` — lite idempotency
- `apps/web/app/api/v1/worker/day/end/route.ts` — lite idempotency
- `apps/web/app/api/v1/worker/report/create/route.ts` — lite idempotency
- `apps/web/app/api/v1/worker/report/add-media/route.ts` — lite idempotency
- `apps/web/app/api/v1/worker/report/submit/route.ts` — lite idempotency (replaced inline idempotency)
- `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts` — uses AIService.analyzeImage
- `apps/web/lib/ai/runVisionAnalysis.ts` — thin wrapper around AIService
- `apps/web/lib/platform/ai/providers/provider.openai.ts` — shared prompts (Stage 1)
- `apps/web/lib/platform/ai/providers/index.ts` — explicit exports (baseline)
- `apps/web/lib/sync/sync.service.ts` — tasks type assertion for BootstrapResult
- (Baseline) `apps/web/lib/config`, `devices/register`, `analytics.service`, `queue.db` — type/build fixes only

---

## 3. How to verify locally

```bash
cd apps/web
npm install --legacy-peer-deps
npm test -- --run
npm run build
npm run cf:build
```

Optional (requires running app): `npm run e2e` for Playwright smoke tests.

---

## 4. API behavior notes

- **Unchanged:** Request/response JSON shapes for health, config, projects, analyze-image, jobs/process, sync bootstrap/changes/ack, media upload-sessions, worker endpoints, devices, tenant invites. Status codes and error codes (e.g. `quota_exceeded`, validation 4xx) preserved.
- **Lite clients (`x-client: ios_lite` or `android_lite`):**
  - **403** on disallowed paths: e.g. `/api/v1/projects`, `/api/v1/admin/*`, `/api/v1/billing/*`, `/api/v1/org/*`, `/api/v1/jobs/process`, `/api/v1/ai/*` (and any path not in the allow-list).
  - **400** on write endpoints (POST to upload-sessions, worker day/report, sync/ack) when `x-idempotency-key` is missing; body includes `code: "idempotency_key_required"`.
  - Replay with same `x-idempotency-key` returns the same stored response; no duplicate mutations.
- **Web/full clients:** No allow-list or idempotency requirement; behavior unchanged.

---

## 5. Remaining known gaps for Phase 2

- Admin/billing completeness (audit and align with allow-list).
- Legacy route deprecation (e.g. document or redirect `/api/ai/analyze-image` → v1).
- Root app cleanup: confirm no deploy path uses root `/app`; then delete or document.
- Cron strategy for `/api/v1/jobs/process` (who calls it, rate, idempotency if needed).

---

## 6. Risk checklist and mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Lite clients break (wrong allow-list) | Allow-list includes all current worker/sync/media/devices/config/auth paths; 403 body is stable for client handling. |
| Idempotency storage/ttl | Uses existing idempotency service and repo; TTL and key scope (tenant/user/route) unchanged. |
| Policy/router bypass | All vision flows go through AIService; no direct OpenAI in routes or job handlers. |
| Bootstrap response shape change | SyncService returns same shape; test asserts keys and types. |
| Build/type regressions | Type fixes applied in ai-analyze-media (payload), sync.service (tasks cast), lite-idempotency (Request/isLiteClient). |

---

## Verification checklist (final)

- [x] unit tests passing (194 tests, 41 files)
- [x] build passing (`npm run build`)
- [x] cf:build passing (`npm run cf:build`)
- [ ] smoke tests passing (if present) — run `npm run e2e` with app running
- [x] deployed route entry clarified (apps/web)
