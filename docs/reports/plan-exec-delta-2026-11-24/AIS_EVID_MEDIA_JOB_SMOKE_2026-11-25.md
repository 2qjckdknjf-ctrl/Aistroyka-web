# AIS-EVID media→job staging smoke — 2026-11-25

Follow-up to #538 (Bearer request-bound project upload) and EVID inventory (#536).

## Environment

| Field | Value |
|---|---|
| Staging health (post-#539) | `buildStamp.sha7=6a0667c` |
| Production health | catching up from `d3e66c5` after #538/#539 |
| Auth | SMOKE_* Bearer JWT |
| Project | `0ed33099-55a9-4568-861a-ebd224bb29e0` |

## Results

| Step | Result |
|---|---|
| `POST /api/v1/projects/:id/upload` multipart + Bearer | **200** `success:true` |
| Created media | `eb87ee72-13b4-4481-84ed-6f97ce9480e0` |
| Created analysis job | `ceba5b23-3420-48d3-a79d-6591d40a0e01` |
| `GET …/jobs/:jobId` (~50s poll) | **200** status remains `queued` / lifecycle `QUEUED` |
| `POST …/jobs/:jobId/trigger` (pre-#539) | **404** cookie-only client |
| `POST …/jobs/:jobId/trigger` (post-#539 on `6a0667c`) | **200** `success:true` status queued |
| Poll after trigger (~30s) | still `QUEUED`, `attempt_count=0` |
| `POST /api/v1/admin/jobs/cron-tick` as smoke | **403** (expected) |

## Verdict

| Dimension | Status |
|---|---|
| Bearer upload + durable job enqueue | **PASS** (#538) |
| Bearer job trigger | **PASS** (#539) |
| Async worker completion → persist → human review | **PARTIAL** — RPC re-queues but no worker drain in smoke session (`attempt_count` stays 0) |
| Analyze-image live gate (prior) | **GO** on staging (#536) |

Next: cron/admin job processor drain of `analysis_jobs` (owner secret or scheduled tick), then poll → completed → review route.
