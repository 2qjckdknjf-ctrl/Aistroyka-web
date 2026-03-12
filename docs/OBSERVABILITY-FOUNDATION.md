# Observability Foundation

## Overview

Production-ready observability includes error tracking, structured logging, and health/metrics endpoints. No internal stack traces or secrets are exposed to clients.

## Error tracking

- **lib/errors** — Centralized error handling:
  - **error.types.ts**: `AppError` with `code`, `statusCode`, `publicMessage` (client-safe).
  - **error-mapper.ts**: `mapErrorToResponse()` — maps any error to HTTP status and safe JSON body (no stack).
  - **error-handler.ts**: `handleError()` — logs via observability, optionally calls `captureException` for 5xx, returns `MappedErrorResponse`.

Use in API routes:

```ts
try {
  // ...
} catch (err) {
  const { statusCode, body } = handleError(err, { requestId, route, tenantId, userId });
  return NextResponse.json(body, { status: statusCode });
}
```

- **lib/observability/error-tracking.ts** (existing): `captureException()` for categorization and future Sentry integration. Categories: auth, tenant_context, report_submit, upload, sync, api_5xx, api_4xx, etc.

## Logging

- **lib/logging** — Lightweight layer; use in services instead of `console.log`:
  - **log-levels.ts**: `LogLevel` (debug, info, warn, error), `getConfiguredLogLevel()` (env `LOG_LEVEL`), `isLevelEnabled()`.
  - **logger.ts**: `debug()`, `info()`, `warn()`, `error()` — delegate to `logStructured` from observability; respect `LOG_LEVEL` and skip in test.

- **lib/observability/logger.ts** (existing): `logStructured()`, `logInfo`, `logWarn`, `logError` — JSON to stdout, sanitized (no token/password/secret).

## Health and metrics

- **GET /api/system/health** — System health: status, timestamp, services (database, ai_brain, copilot, workflows, events, alerts). Uses Supabase ping and config flags.
- **GET /api/v1/health** (existing) — Legacy/canonical health (ok, db, aiConfigured, etc.).
- **GET /api/system/metrics** — Counts: projects_count, tasks_count, reports_count, alerts_count, ai_signals_count. Optional `x-tenant-id` for tenant-scoped counts. Safe placeholders when DB unavailable.

## Data consistency checks

- **lib/system/data-checks**: `runDataChecks(supabase)` returns issues:
  - projects without tasks
  - tasks without reports
  - tasks requiring evidence without photos
  - alerts without tenant reference

Can be used from cron or admin endpoints; not exposed on public API by default.

## Security

- **Security headers** (lib/security-headers, next.config): X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Content-Security-Policy, Permissions-Policy. CSP allows self, Supabase, inline scripts/styles as configured.
- **Middleware** also applies security headers (including CSP) and HSTS in production.
