# API v1 — Jobs and Sync

## Jobs

| Method | Endpoint | Auth | Description |
| -------- | ---------- | ------ | ------------- |
| POST | /api/v1/jobs/process?limit=5 | Owner/Admin | Claim and process up to limit jobs. Rate-limited. Returns { ok, processed, success, failed, dead }. |

## Report analysis (async)

| Method | Endpoint | Auth | Description |
| -------- | ---------- | ------ | ------------- |
| POST | /api/v1/worker/report/submit | Member | Submit report; enqueues ai_analyze_report + ai_analyze_media jobs. Returns { reportId, jobIds, status: "queued" }. Idempotency: x-idempotency-key. |
| GET | /api/v1/reports/:id/analysis-status | Member (own report) | Returns { status: "queued"\|"running"\|"success"\|"failed", reportId, jobCount, summary? }. |

## Sync (mobile offline)

| Method | Endpoint | Auth | Description |
| -------- | ---------- | ------ | ------------- |
| GET | /api/v1/worker/sync?since=<iso> | Member | Returns { serverTime, traceId, data: { tasks, reports, uploadSessions }, pagination }. Optional since for delta. |

## Admin

| Method | Endpoint | Auth | Description |
| -------- | ---------- | ------ | ------------- |
| GET | /api/v1/admin/metrics/overview?range=30d | Owner/Admin | tenant_daily_metrics for tenant. |
| GET | /api/v1/admin/ai/usage?range=30d | Owner/Admin | AI usage from ai_usage (by date). |
| GET | /api/v1/admin/jobs?status=failed | Owner/Admin | Failed/dead jobs for tenant. |

## Contracts

- Report submit response: { reportId: string, jobIds: string[], status: "queued" }.
- Analysis status: { status, reportId, jobCount, summary?: { mediaTotal, analyzed, failed } }.
- Sync response: { serverTime: string (ISO), traceId: string, data: { tasks, reports, uploadSessions }, pagination: null }.
