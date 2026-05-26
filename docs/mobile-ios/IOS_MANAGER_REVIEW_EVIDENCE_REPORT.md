# iOS Manager — report evidence & reject (Phase 4 slice)

**Date:** 2026-05-13  
**Links Phase 0 audit:** §14 P0 — Manager needs visual evidence; explicit Reject; remove bogus `reviewed` API usage.

## Backend

- **`listMediaByReportIdWithUrls`** in `apps/web/lib/domain/reports/report.repository.ts`: enriches each `worker_report_media` row with optional **`file_url`** — from `media.file_url` when `media_id` is set, else public storage URL from finalized `upload_sessions.object_path` (same pattern as `resolve-image-url` jobs helper).
- **`GET` / `PATCH` `/api/v1/reports/:id`** now return media rows including `file_url` when resolvable.
- **`PATCH` review**: `rejected` and `changes_requested` require a non-empty `manager_note` (400 + `manager_note_required` if missing).

## AiStroykaManager

- **`ReportMediaItem`** decodes optional `file_url`.
- **`ReportEvidenceItemView`**: `AsyncImage` preview (max height ~240pt), fallback copy when URL missing or load fails.
- **Review actions** for `submitted`: **Approve**, **Request changes**, **Reject** (`rejected`). Removed **Mark reviewed** — that status is not accepted by the API (DB uses `rejected` per `20260307300000_report_reject_semantics.sql`).
- **`isReviewStatus`**: `approved` | `rejected` | `changes_requested`.
- **Inbox row**: shortened report id display; status labels show underscores as spaces.
- **Strings** (en/ru/es/it): `mgr_reject`, `mgr_evidence_*`, onboarding/how-it-works bullets aligned with approve/reject/request changes.
- **Reject / request changes**: non-empty manager note required (matches API `manager_note_required`); `reviewActionError` clears when the note field changes.

## Validation

- `bunx tsc -p apps/web/tsconfig.json --noEmit` — pass.
- `xcodebuild -scheme AiStroykaManager … CODE_SIGNING_ALLOWED=NO` — **BUILD SUCCEEDED**.
- **Web** `ReportApprovalCard`: client-side note check before reject / request changes; note field **above** buttons; typing clears inline error.

## Limits

- Previews depend on **`media.file_url`** or **public** bucket URLs; private buckets without signed URLs may still fail `AsyncImage` (UI shows localized failure).

## Verdict

- **Phase 4 slice (evidence + reject + API alignment):** **YES** for this iteration.
- **Full product-ready Manager:** still subject to signing and XCTest gates from the audit.
