# iOS / backend — resubmit flow (Phase 5)

**Project:** AISTROYKA  
**Date:** 2026-05-19  
**Depends on:** `IOS_CURRENT_STATE_AUDIT.md`, `IOS_WORKER_MVP_COMPLETION_REPORT.md`  

## Purpose

Document the **real** path from **manager “request changes”** to **worker resubmit** so roadmap Phase 5 is evidence-based (not UI-only). This report ties together **AiStroykaWorker** UI, **operation queue**, and **web API** behavior.

---

## Sequence (happy path)

1. Manager opens a submitted report, chooses **Request changes** (or **Reject** ends the loop differently), supplies a non-empty **`manager_note`** (API enforces `manager_note_required` for reject / changes_requested).
2. Report status becomes **`changes_requested`**; history fields (`reviewed_at`, `reviewed_by`, `manager_note`) remain per `report.repository.ts` **`resubmit`** semantics.
3. Worker **`GET /api/v1/worker/sync`** returns report rows; **`HomeView`** filters `status == "changes_requested"` into **Manager feedback** and navigates with **`NavigationLink(value: reportId)`** to **`ReportResubmitView`**.
4. **`ReportResubmitView`** loads **`GET /api/v1/reports/:id`** (lite-allowed for own report), shows **`manager_note`** and optional **`worker_note`** (prior reply).
5. Worker taps **Submit again** → enqueues **`QueuedOperation`** type **`submitReport`** with existing **`reportId`**, **`taskId`** from detail, fresh **`x-idempotency-key`**, optional **`workerNote`** (trimmed, max 2000 chars).
6. **`OperationQueueExecutor`** POSTs **`/api/v1/worker/report/submit`** with body `{ report_id, task_id?, worker_note? }`.
7. Server **`submitReport`** (`report.service.ts`): if status is **`changes_requested`** and there is at least one media row with **`media_id` or `upload_session_id`**, calls **`repo.resubmit`**; else returns **`proof_required`** (400).

---

## API surface (canonical)

| Step | Method | Path | Notes |
|------|--------|------|--------|
| List feedback | GET | `/api/v1/worker/sync` | Client filters `changes_requested`. |
| Detail | GET | `/api/v1/reports/:id` | Worker sees own report; includes `manager_note` / `worker_note` when present. |
| Submit / resubmit | POST | `/api/v1/worker/report/submit` | Idempotency: lite middleware `requireLiteIdempotency`. |
| Manager review | PATCH | `/api/v1/reports/:id` | `changes_requested` + note → worker loop. |

---

## Server rules (honest constraints)

- **Resubmit does not add new photos:** **`addMediaToReport`** allows attachment only when report status is **`draft`**. For **`changes_requested`**, existing proof must already be on the report; otherwise **`proof_required`**.
- **New proof after changes:** requires a **new report** (new draft flow from home), not this resubmit path — UI copy in **`ReportResubmitView`** / localized hint should say so (see `IOS_WORKER_MVP_COMPLETION_REPORT.md`).
- **`worker_note`** is persisted on resubmit path when the server and migration support it (`worker_report.worker_note`-style column — see repo migrations).

---

## iOS implementation map

| Component | Role |
|-----------|------|
| `HomeView.loadFeedbackReports` | `WorkerAPI.workerSync()` → filter `changes_requested`. |
| `HomeView` | `navigationDestination(for: String.self)` → `ReportResubmitView`. |
| `ReportResubmitView` | `WorkerAPI.reportDetail`, enqueue `submitReport` with `reportId`, `workerNote`. |
| `OperationQueueExecutor` | POST submit; surfaces `lastErrorCode` (`proof_required`, `max_attempts`, etc.). |

---

## Validation (this pass)

| Check | Result |
|--------|--------|
| `xcodebuild` AiStroykaWorker Debug (simulator, `CODE_SIGNING_ALLOWED=NO`) | **PASS** — 2026-05-19 |
| Staging E2E (login → review → resubmit → inbox) | **Not logged** — Phase 9 |

---

## Phase 5 closure

### A. PHASE STATUS

**CLOSED** for **documented integration** (UI + queue + server branch). **Full E2E proof** remains Phase 9.

### B. WHAT THIS REPORT ADDS

- Single reference for **resubmit** semantics linking Worker, `submit` route, and `report.service` / `repo.resubmit`.
- Explicit **media / proof** constraint so product does not over-promise “replace photos on resubmit”.

### C. NEXT PHASE ALLOWED

**YES** — Phase 6 (evidence hardening: gallery, signed URLs, failure modes) and Phase 9 (logged cross-app E2E).

---

*End of Phase 5 resubmit report.*
