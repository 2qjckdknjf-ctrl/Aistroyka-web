# AIS-EVID / CORRECTION-009 human review staging smoke — 2026-11-25

Follow-up to media→job→persist completed (`AIS_EVID_MEDIA_JOB_COMPLETED_2026-11-25.md`).

## Environment

| Field | Value |
|---|---|
| Staging | `buildStamp.sha7=d84232f` |
| Auth | SMOKE_* Bearer (manager rights) |
| Route | `POST /api/v1/ai/analysis/:id/review` |

## Results

| Verdict | Analysis id | HTTP | graph_eligible | correction_id |
|---|---|---|---|---|
| `accepted` | `54691505-b953-4064-aaf8-c6fca059db1a` | **200** | true | `0b44f433-…` |
| `edited` (+ corrected_payload) | `09b4141a-91f3-410c-be58-ff4ee739b03d` | **200** | true | `ea0ec058-…` |
| `accepted` → `rejected` | `a7ff5a6b-af81-4b97-bb26-f0310f6571b6` | **200** / **200** | true → **false** | `87c16d48-…` / `9f9cb9ee-…` |
| `insufficient_evidence` | `0ae86392-1808-4c65-9b61-6379fa9b1609` | **200** | false | `e24ba732-…` |

Correction provenance rows present in `ai_analysis_corrections` for accepted/edited/rejected paths.

## Verdict

Human review + CORRECTION-009 provenance on staging: **PASS**. Reject clears `graph_eligible` (GRAPH-004 wiring live).

Not claimed: device UI review flow; dense Graph edge invalidation fixture beyond eligibility flag.
