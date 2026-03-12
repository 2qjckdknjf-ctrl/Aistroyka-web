# API governance and deprecation

## Route classification

| Prefix | Status | Use for new work |
|--------|--------|-------------------|
| /api/v1/* | Current | Yes. All new endpoints under v1. |
| /api/health, /api/health/auth | Keep | No version; stable. |
| /api/auth/login | Keep | Auth entry; no v1 duplicate. |
| /api/tenant/* | Keep | Tenant management; consider v1 alias later. |
| /api/projects, /api/projects/[id] | Deprecate | Use /api/v1/projects, /api/v1/projects/[id]. Deprecation + Link successor. |
| /api/analysis/process | Deprecate | Use /api/v1/jobs/process or cron-tick. Deprecation headers. |
| /api/ai/analyze-image | Deprecate | Use /api/v1/ai/analyze-image. Already has deprecation. |
| /api/projects/[id]/upload, poll-status, jobs/*, media/* | Legacy | Prefer v1 media/upload-sessions and v1/jobs/process. |

## Auth pattern

- **v1 and tenant routes:** getTenantContextFromRequest + requireTenant; admin routes add requireAdmin.
- **Legacy routes:** RPC or createClient + getSessionUser; tenant enforced inside RPC (e.g. getProjectById). Do not add new legacy routes; prefer v1 with explicit requireTenant.

## Deprecation headers

- **Deprecation: true**, **Sunset: 2026-06-01**, **Link: </api/v1/...>; rel="successor"** where applicable.
- Set via setLegacyApiHeaders(res.headers) on legacy route responses.

## Future work

- New features: v1 only. No new unversioned or legacy paths.
- Migrate remaining callers from legacy project and analysis endpoints to v1; then remove legacy routes after sunset.
