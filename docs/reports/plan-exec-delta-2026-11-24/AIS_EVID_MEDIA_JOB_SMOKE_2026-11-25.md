# AIS-EVID media→job staging smoke — 2026-11-25

Follow-up to #538 (Bearer request-bound project upload) and EVID inventory (#536).

## Environment

| Field | Value |
|---|---|
| Staging health | `buildStamp.sha7=d3e66c5` |
| Production health | `buildStamp.sha7=d3e66c5` |
| Auth | SMOKE_* Bearer JWT |
| Project | `0ed33099-55a9-4568-861a-ebd224bb29e0` |

## Results

| Step | Result |
|---|---|
| `POST /api/v1/projects/:id/upload` multipart + Bearer | **200** `success:true` |
| Created media | `eb87ee72-13b4-4481-84ed-6f97ce9480e0` |
| Created analysis job | `ceba5b23-3420-48d3-a79d-6591d40a0e01` |
| `GET …/jobs/:jobId` (~50s poll) | **200** status remains `queued` / lifecycle `QUEUED` |
| `POST …/jobs/:jobId/trigger` | **404** `Project not found` (caller path/policy gap — not invented as success) |
| `POST /api/v1/admin/jobs/cron-tick` as smoke | **403** (expected) |

## Verdict

| Dimension | Status |
|---|---|
| Bearer upload + durable job enqueue | **PASS** (unblocked by #538) |
| Async worker completion → persist → human review | **PARTIAL** — job stuck QUEUED without admin/cron processor rights in this smoke |
| Analyze-image live gate (prior) | **GO** on staging (#536) |

Follow-up in same PR: `jobs/:jobId/trigger` switched to `createClientFromRequest` (was cookie-only → 404 Project not found under Bearer). Re-smoke trigger after deploy, then cron/worker completion → review.
