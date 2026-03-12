# System Health

## Endpoints

### GET /api/system/health

Returns system health with per-service status.

**Response (200 or 503):**

```json
{
  "status": "ok",
  "timestamp": "2025-03-11T12:00:00.000Z",
  "services": {
    "database": "ok",
    "ai_brain": "ok",
    "copilot": "ok",
    "workflows": "ok",
    "events": "ok",
    "alerts": "ok"
  }
}
```

- **status**: `ok` | `degraded` | `error`. `degraded` when some services are `unavailable`; `error` when any service is `error`.
- **services**: Each value is `ok` | `degraded` | `error` | `unavailable`.
  - **database**: Supabase connectivity (tenants table select).
  - **ai_brain**: Configured (OPENAI or AI_ANALYSIS_URL + service role).
  - **copilot**: Same as ai_brain.
  - **workflows**, **events**: In-process; always `ok`.
  - **alerts**: Alerts table select; `unavailable` if Supabase env missing.

**Implementation**: `lib/system/health.service.ts` — `getSystemHealth()`.

### GET /api/system/metrics

Returns aggregate counts for observability. Optional header `x-tenant-id` for tenant-scoped counts (RLS applies with anon client).

**Response (200):**

```json
{
  "projects_count": 10,
  "tasks_count": 100,
  "reports_count": 80,
  "alerts_count": 2,
  "ai_signals_count": 5,
  "_meta": { "source": "database", "at": "2025-03-11T12:00:00.000Z" }
}
```

When DB is unavailable or not configured, counts are `null` and `_meta.source` is `"placeholder"`.

**Implementation**: `lib/system/metrics.service.ts` — `getSystemMetrics()`. Tables: projects, worker_tasks, worker_reports, alerts; ai_signals from ai_requests if present.

## Existing health

- **GET /api/health** — Legacy; delegates to same logic as v1.
- **GET /api/v1/health** — Canonical v1 health (ok, db, aiConfigured, openaiConfigured, supabaseReachable, buildStamp, etc.). Contract validated by `@aistroyka/contracts`.

Use `/api/system/health` for orchestration/monitoring that needs service-level breakdown; use `/api/v1/health` for simple up/down and contract compliance.
