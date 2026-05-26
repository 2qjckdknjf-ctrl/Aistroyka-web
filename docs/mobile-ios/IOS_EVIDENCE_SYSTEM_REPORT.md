# iOS / web — evidence system (Phase 6)

**Project:** AISTROYKA  
**Date:** 2026-05-19  
**Depends on:** `IOS_MANAGER_REVIEW_EVIDENCE_REPORT.md`, `IOS_RESUBMIT_FLOW_REPORT.md`  

## Mission

Describe how **worker report media** becomes a **reviewable URL** for managers and workers, where preview **works vs fails**, and what **product gaps** remain (signed URLs, gallery UX).

---

## Data path

1. **`worker_report_media`** links a report to **`media_id`** and/or **`upload_session_id`**.
2. **`listMediaByReportIdWithUrls`** (`apps/web/lib/domain/reports/report.repository.ts`):
   - For **`media_id`**: reads **`media.file_url`** from the `media` table (non-empty string wins).
   - For **session-only rows**: if `upload_sessions.status === "finalized"` and `object_path` is set, builds  
     `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/{object_path}`.
3. **`GET /api/v1/reports/:id`** attaches **`media`** as an array of `{ media_id, upload_session_id, file_url }` (spread into report JSON). Same payload for **manager** and **lite worker** (worker scoped to **own** report only).

---

## Client behavior

### AiStroyka Manager

- **`ReportDetailReviewView`** → **`ReportEvidenceItemView`**: **`AsyncImage`** from `file_url`, max height ~240pt.
- **No URL / load failure:** localized `mgr_evidence_no_preview_fmt` / `mgr_evidence_load_failed_fmt` (see `ReportsInboxView.swift`).

### AiStroyka Worker

- **`ReportResubmitView`**: decodes optional **`media`**; **`WorkerReportEvidenceItemView`** mirrors Manager **`AsyncImage`** behavior so the worker sees **existing proof** while addressing `changes_requested`.
- **`GET` detail** already returned media; prior client omitted the field — now surfaced for resubmit UX only (not required for create flow).

---

## Constraints (honest)

| Topic | Behavior |
|--------|-----------|
| **Public bucket assumption** | Composed Supabase **public** object URL works only if the bucket/object is **world-readable**. Private buckets → `AsyncImage` **failure** unless the app uses **signed URLs** (not implemented in this slice). |
| **`media.file_url`** | May point to CDN or absolute URL; must be **HTTPS** and allowed by ATS. |
| **Sessions not finalized** | No `file_url` until upload session is **finalized** — preview stays “unavailable”. |
| **Full-screen / zoom gallery** | **Not** in scope; list of thumbnails only. |
| **Web dashboard** | `ReportApprovalCard` and related surfaces are separate; this report focuses on **iOS + GET reports API**. |

---

## Validation

| Check | Result |
|--------|--------|
| Code review: repo URL composition + GET route | **DONE** |
| `xcodebuild` AiStroykaWorker Debug (simulator, `CODE_SIGNING_ALLOWED=NO`) | **PASS** — 2026-05-19 |
| Staging: real `file_url` from pilot tenant | **Not logged** — Phase 9 |

---

## Phase 6 closure

### A. PHASE STATUS

**CLOSED** for **documented contract + Manager preview + Worker resubmit preview** (2026-05-19). **Signed URLs / deep gallery / device E2E** remain follow-ups.

### B. WHAT SHIPPED THIS PASS

- `IOS_EVIDENCE_SYSTEM_REPORT.md` (this file).
- Worker: `WorkerReportMediaItem`, `WorkerReportDetailData.media`, thumbnails on **`ReportResubmitView`**; strings **en / ru / es / it**.

### C. REMAINING (P1 / Phase 9)

- Optional **signed URL** API for private media + client switch from raw `file_url`.
- **UITest**: open report with media mock or recorded stub.
- **Zoom / share** sheet for evidence.

### D. NEXT PHASE ALLOWED

**YES** — Phase 7 (intelligence surfaces) or **Phase 9** (E2E validation report with staging logs).

---

*End of Phase 6 evidence report.*
