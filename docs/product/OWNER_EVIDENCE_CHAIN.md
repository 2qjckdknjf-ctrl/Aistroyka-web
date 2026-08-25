# Owner Evidence Chain — Product Specification

**Version:** pilot-v1  
**Date:** 2026-08-24

## Purpose

Transform field photos from attachments into a **structured, auditable project record** visible to owners only after manager verification.

## Chain

```
photo capture → upload session (before/after purpose) → worker report media
→ visual_evidence_records (metadata) → manager review → owner_visible flag
→ owner portal visual progress
```

## Metadata model (`visual_evidence_records`)

| Field | Pilot | Future |
|-------|-------|--------|
| tenant_id, project_id | Required | Required |
| report_id, task_id | When linked | Required for traceability |
| media_id / upload_session_id | One required | Same |
| source_kind | `photo`, `video` active | `panorama_360`, `drone`, `sensor`, `equipment`, `robot` reserved |
| before_after_kind | `before`, `after`, `unpaired` | Paired groups via `pair_group_id` |
| zone_label | Optional | Recommended for multi-zone projects |
| owner_visible | Default false | Set true after manager approval workflow |
| manager_verified | Default false | Set true on report approval |
| ai_analysis_status | Tracked | Optional AI pipeline |
| provenance, checksum | Stored | Chain-of-custody extension point |

## Server rules

1. Evidence synced on report submit (`syncEvidenceFromReportMedia`) — always `owner_visible=false`.
2. Manager approval triggers `applyOwnerVisibilityOnReportReview` (server-only; clients cannot set visibility).
3. Reject/changes_requested hides evidence again (idempotent).
4. Completeness evaluated server-side (`evaluateReportCompleteness`).
5. Owner portal lists only `owner_visible=true` + `internal_only=false` + `retention_state=active`.
6. Portal APIs return **signed URLs only** (`signed_image_url`, TTL 900s) via `createSignedUrlForPath` — no storage paths or public URLs.

## Customer safety

- No internal contractor notes in owner APIs.
- No unconfirmed financial impact in overview.
- AI-generated content labeled; confidence shown only when computed.

## Mobile contract alignment

- Upload purposes: `report_before`, `report_after` (existing).
- Completeness: `GET /api/v1/reports/:id/completeness` (new).
- Contracts: `ReportCompletenessResultSchema` in `@aistroyka/contracts`.

## Gaps (post-pilot)

- Signed URLs for stakeholder media access.
- Automatic `owner_visible` flip on report approval (currently manual/default false).
- EXIF/GPS capture metadata from devices.
