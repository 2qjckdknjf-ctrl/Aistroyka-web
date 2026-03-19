# Phase 8 — Release correlation standard

## Build identity

| Source | Field in telemetry |
|--------|-------------------|
| `NEXT_PUBLIC_BUILD_SHA` | `build_sha7` (first 7 chars) |
| `VERCEL_GIT_COMMIT_SHA` | fallback in `getBuildStamp()` |
| `GITHUB_SHA` | fallback in `getBuildStamp()` |

## Environment

| Source | Field |
|--------|-------|
| `NEXT_PUBLIC_APP_ENV` | `app_env` |
| `NODE_ENV` | fallback |

## Where attached

- All Phase 8 structured AI log lines (when env vars present).
- `audit_logs.details` for AI runtime rows.

## Regression workflow

1. Note deploy time + `build_sha7` from `/api/v1/admin/ops/ai-runtime` → `correlation`.
2. Compare error rates in `aggregates.by_action` before/after deploy window.
3. Drill into `recent_error_sample` → `trace_id` → full log line.
