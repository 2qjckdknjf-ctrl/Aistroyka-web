# Vision job lifecycle slice — 2026-10-03

Maps stored `analysis_jobs.status` onto:

QUEUED ← pending|queued  
PROCESSING ← processing  
SUCCEEDED ← completed only  
FAILED_RETRYABLE ← failed + retryable error_type + attempts < 3  
FAILED_FINAL ← otherwise, including unknown status (never fake success)

`GET /api/v1/projects/:id/jobs/:jobId` returns `{ status, lifecycle }`.  
`GET /api/v1/projects/:id/poll-status` includes per-job lifecycle.  
`processOneJob` records retryable vs final from `classifyVisionFailure`. Video-not-implemented remains FAILED_FINAL.
