# Wave 3 — Implementation plan (Worker flow completion)

**Mode:** Release 1 Wave 3 only — worker operational flow across web API and mobile clients.  
**Authority:** `PHASE1_FINAL_SCOPE.md`, `PHASE1_EXECUTION_WAVES.md`, `G9_PRODUCT_DECISION_APPROVED.md` (photo required; text comment + tri-state deferred; video/voice out).

---

## Exact Wave 3 targets

1. **Worker task access** — `GET /api/v1/worker/tasks/today` remains canonical; ensure **task detail** is safe for workers (not manager-only).
2. **Report submit** — **Server-side photo proof** required before submit (G9); no reliance on client-only checks.
3. **Report read scope** — Workers may only **read their own** report via `GET /api/v1/reports/:id` (managers retain full tenant read for review).
4. **Minimum mobile alignment** — Optional `GET /api/v1/tasks/:id` from Worker API clients for parity (iOS/Android shared clients).
5. **No deferred G9 items** — Do not add text comment fields, tri-state completion, video, or voice.

---

## Surfaces covered

| Area | Path |
|------|------|
| Report submit domain | `apps/web/lib/domain/reports/report.service.ts` |
| Worker submit route | `apps/web/app/api/v1/worker/report/submit/route.ts` |
| Task GET | `apps/web/lib/domain/tasks/task.service.ts`, `apps/web/app/api/v1/tasks/[id]/route.ts` |
| Report GET | `apps/web/app/api/v1/reports/[id]/route.ts` |
| Tests | `report.service.task-link.test.ts`, `task.service.test.ts` |
| iOS | `ios/Shared/Sources/Shared/Endpoints.swift`, `ios/AiStroykaWorker/.../WorkerAPI.swift` |
| Android | `android/shared/.../WorkerApi.kt`, `android/shared/.../WorkerDtos.kt` (if needed) |

---

## Dependency order

1. Domain: `submitReport` proof gate + reuse `listMediaByReportId` for downstream jobs.  
2. HTTP: map `proof_required` → 400; worker `GET tasks/:id`; report `GET` owner check.  
3. Tests: extend Vitest mocks.  
4. Mobile: thin `task(id)` on Worker API clients.  
5. Docs + verification log.

---

## Risk controls

- **No** edits to `apps/web/lib/tenant/**`, `middleware.ts`, or `lite-allow-list` unless a blocker appears (none planned).
- **Surgical** report/task routes only; no upload-session semantics change.
- Android `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` remains **non-default** debug; server still enforces proof for R1 truth.

---

## Explicitly out of Wave 3

- Manager completion, Client apps, notifications expansion, earnings light, AI assist, billing pilot, ai-brain.
- Tri-state and free-text comment (G9 deferred).
- Video / voice capture or upload.

---

**STOP** — Execute in order above; then append `WAVE3_PROGRESS_LOG.md` and finalize status docs.
