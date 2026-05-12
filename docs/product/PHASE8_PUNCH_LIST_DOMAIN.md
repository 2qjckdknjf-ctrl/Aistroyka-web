# Phase 8 — Punch list / defects (domain)

## Persistence

Single table **`public.project_defects`** (see migration `20260404120000_project_defects.sql`). Roadmap text `punch_items` refers to this table.

Optional columns (follow-up migration `20260507193000_project_defects_severity_and_photos.sql`):

- `severity` — `low` | `medium` | `high` | `critical`
- `photo_before_report_media_id`, `photo_after_report_media_id` — FK to `worker_report_media` for worker-submitted evidence links (no finance).

## Status model (implementation)

| Status | Meaning |
|--------|---------|
| `open` | Reported, not started |
| `in_progress` | Work underway |
| `ready_for_verification` | Ready for manager verification (roadmap “ready for review”) |
| `resolved` | Fix applied |
| `closed` | Accepted / cancelled from customer perspective |

`is_blocking` flags items that **block handover** until cleared (see `handover-readiness.ts`).

## Access

- **Managers:** full CRUD, transitions, assignee, internal fields in detail API.
- **Stakeholders (client portal):** read list + public detail shape; may create defects where policy allows.

## APIs

- `GET/POST /api/v1/projects/:id/defects`
- `GET/PATCH /api/v1/projects/:id/defects/:defectId`
- `POST /api/v1/projects/:id/defects/:defectId/transition`

## UI

- Manager: project defect detail and tabs (see `defects/[defectId]/ManagerDefectDetailClient`).
- Owner portal: `client/defects` list and detail.

## Customer finance isolation

Defects describe snags and acceptance; they do **not** carry cost lines, margin, or subcontractor pricing.
