# Phase 1 Stabilization Report

**Project:** AISTROYKA.AI  
**Phase:** Architecture guardrails stabilization (no new features).  
**Status:** In progress.

---

## Baseline (Stage 0)

### 0.1 Canonical app entry

- **apps/web** is the deployed application: root `package.json` delegates `dev`, `build`, `start`, `cf:build`, `cf:deploy`, `lint` to `apps/web`.
- **Root `/app** (at repository root) is legacy/duplicate: contains `api/`, `(auth)/`, `(dashboard)/`, `smoke/`, but the active app is under `apps/web/app` (with `[locale]`, full API tree). Root `app` was not deleted in this phase per instructions.

### 0.2 Baseline checks (recorded)

| Check | Command | Result |
|-------|---------|--------|
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

## 1. Summary of changes (to be filled)

- AIService (VisionService): _pending_
- SyncService.bootstrap: _pending_
- Lite allow-list enforcement: _pending_
- Idempotency for lite writes: _pending_

---

## 2. Files touched (to be filled)

- _Pending_

---

## 3. How to verify locally (to be filled)

- _Pending_

---

## 4. API behavior notes (to be filled)

- _Pending_

---

## 5. Remaining known gaps for Phase 2

- Admin/billing completeness.
- Legacy route deprecation (e.g. /api/ai/analyze-image → v1 only).
- Root app cleanup (delete or document).
- Cron strategy for /api/v1/jobs/process.

---

## 6. Risk checklist and mitigations

- _To be filled_

---

## Verification checklist (final)

- [ ] unit tests passing
- [ ] build passing
- [ ] cf:build passing
- [ ] smoke tests passing (if present)
- [ ] deployed route entry clarified (apps/web)
