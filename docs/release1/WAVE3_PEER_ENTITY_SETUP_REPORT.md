# Wave 3 — Peer entity setup report

**Date (UTC):** 2026-03-28

## Report owned by Worker B

| Field | Value |
|-------|--------|
| **report id** | `d3d3d3d3-d3d3-4d3d-d3d3-d3d3d3d3d3d1` |
| **tenant_id** | `81870b1a-1118-46a4-9c5d-969ccdf47b58` |
| **user_id (owner)** | `c2b2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b1` (Worker B) |
| **status** | `draft` |

## Task owned by / assigned to Worker B

**Not created** — no `projects` rows in this tenant to attach a `worker_tasks` row without broader seeding. Denial proof focuses on **report** (required). Task denial remains **optional** when a real peer task exists.

## Ownership proof

- Row exists in `worker_reports` with `user_id =` Worker B’s id.
- Live **GET** with Worker B’s JWT returns **200** with that `user_id` in JSON (see denial proof doc).
