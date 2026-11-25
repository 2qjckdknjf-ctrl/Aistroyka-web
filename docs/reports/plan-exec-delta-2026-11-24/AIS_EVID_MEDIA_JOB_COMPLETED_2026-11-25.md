# AIS-EVID media→job→persist completed — 2026-11-25

## Environment

| Field | Value |
|---|---|
| Staging | `buildStamp.sha7=d84232f` (#542) |
| Auth | SMOKE_* Bearer |
| Project | `0ed33099-55a9-4568-861a-ebd224bb29e0` |

## Chain

| Step | Result |
|---|---|
| `POST …/upload` | **200** `jobId=ab8ea8bb-3195-436b-953a-cbfc9ac4bc1a` `mediaId=6599dfe9-e54a-440e-b7e1-b75f703c7bcb` |
| `POST /api/v1/analysis/process` | **200** `processed:true` `status:completed` |
| `analysis_jobs` row | `status=completed`, `error_type=null` |
| `ai_analysis` row | `id=54691505-b953-4064-aaf8-c6fca059db1a` persisted for media |

## Fixes that unblocked this path

| PR | Issue |
|---|---|
| #538 | Bearer upload (cookie-only client) |
| #539 | Bearer job trigger |
| #541 | Worker self-fetch 403 → in-process `analyzeImage` for same-origin `AI_ANALYSIS_URL` |
| #542 | Signed-URL JWT false positive → `secret_detected` / `AI policy blocked` |

## Verdict

Durable **upload → process → completed → ai_analysis persist** on staging: **PASS**.

Still open (not claimed here): human review UI/API on this result, video timecode path, device receipts, multi-persona PILOT (CF 1010).
